import { history } from "../history";
import { trim } from "lodash";

/** When needing to reference the url in some js universally or vice versa. */
export function urlFriendly(stringToFormat: string) {
  return encodeURIComponent(stringToFormat.replace(/ /gi, "_").toLowerCase());
}

/** Get remainder of current url after the last "/". */
export function lastUrlChunk(): string {
  const p = history.getCurrentLocation().pathname;
  const pathArray = trim(p, "/").split("/");
  return pathArray[pathArray.length - 1];
}

/** Fetch query value for the provided key. */
export const getUrlQuery = (key: string): string | undefined =>
  location.search
    .split(`?${key}=`).filter(x => x).pop()?.split("?")[0].split("#")[0];
