import axios, { AxiosPromise } from "axios";
import { OpenFarm, CropSearchResult } from "../open_farm/openfarm";
import { DEFAULT_ICON } from "../open_farm/icons";
import { Actions } from "../constants";
import { ExecutableType } from "farmbot/dist/resources/api_resources";
import { get } from "lodash";
import { ExternalUrl } from "../external_urls";

const url = (q: string) =>
  `${ExternalUrl.OpenFarm.cropApi}?include=pictures&filter=${q}`;
const openFarmSearchQuery = (q: string): AxiosPromise<CropSearchResult> =>
  axios.get<CropSearchResult>(url(q));

interface IdURL {
  id: string;
  url: string;
}

const FALLBACK: OpenFarm.Included[] = [];
export const OFSearch = (searchTerm: string) =>
  (dispatch: Function) => {
    dispatch({ type: Actions.OF_SEARCH_RESULTS_START, payload: undefined });
    openFarmSearchQuery(searchTerm)
      .then(resp => {
        const images: { [key: string]: string } = {};
        get(resp, "data.included", FALLBACK)
          .map((item: OpenFarm.Included) => {
            return { id: item.id, url: item.attributes.thumbnail_url };
          })
          .map((val: IdURL) => images[val.id] = val.url);
        const payload = resp.data.data.map(datum => {
          const crop = datum.attributes;
          const id = get(datum, "relationships.pictures.data[0].id", "");
          return { crop, image: (images[id] || DEFAULT_ICON) };
        });
        dispatch({ type: Actions.OF_SEARCH_RESULTS_OK, payload });
      })
      .catch(() =>
        dispatch({ type: Actions.OF_SEARCH_RESULTS_NO, payload: undefined }));
  };

function isExecutableType(x?: string): x is ExecutableType {
  const EXECUTABLES: ExecutableType[] = ["Sequence", "Regimen"];
  return !!EXECUTABLES.includes(x as ExecutableType);
}

/** USE CASE: You have a `string?` type that you are *certain*
 *            is an `ExecutableType`. But the type checker is
 *            complaining.
 *
 *  PROBLEM:  `as ExecutableType` results in less type safety and
 *            makes bugs harder to pin point in production.
 *
 * SOLUTION:  Run a user defined type guard (`x is ExecutableType`)
 *            and raise a runtime error with the offending string
 */
export function executableType(input?: string): ExecutableType {
  if (isExecutableType(input)) {
    return input;
  } else {
    throw new Error("Assumed string was ExecutableType. Got: " + input);
  }
}
