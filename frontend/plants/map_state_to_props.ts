import moment from "moment";
import { Everything } from "../interfaces";
import { EditPlantInfoProps } from "../farm_designer/interfaces";
import {
  maybeFindPlantById, maybeFindPlantTemplateById, maybeGetTimeSettings,
} from "../resources/selectors";
import { history } from "../history";
import { PlantStage, TaggedPoint } from "farmbot";
import { TaggedPlant } from "../farm_designer/map/interfaces";
import { isNumber, get } from "lodash";
import { getWebAppConfigValue } from "../config_storage/actions";

export function mapStateToProps(props: Everything): EditPlantInfoProps {
  const openedSavedGarden =
    props.resources.consumers.farm_designer.openedSavedGarden;
  const gardenOpen = !!openedSavedGarden;
  const findPlant = (id: string | undefined) => {
    const num = parseInt(id || "NOPE", 10);
    if (isNumber(num) && !isNaN(num)) {
      return gardenOpen
        ? maybeFindPlantTemplateById(props.resources.index, num)
        : maybeFindPlantById(props.resources.index, num);
    }
  };

  return {
    openedSavedGarden,
    findPlant,
    push: history.push,
    dispatch: props.dispatch,
    timeSettings: maybeGetTimeSettings(props.resources.index),
    getConfigValue: getWebAppConfigValue(() => props),
  };
}

/**
 * All of the info a user would need to know about a plant, formatted and ready
 * to use by the UI.
 */
export interface FormattedPlantInfo {
  x: number;
  y: number;
  z: number;
  radius: number;
  id: number | undefined;
  name: string;
  uuid: string;
  daysOld: number;
  plantedAt: moment.Moment;
  slug: string;
  plantStatus: PlantStage;
  meta?: Record<string, string | undefined>;
}

/** Get date planted or fallback to creation date. */
const plantDate = (plant: TaggedPlant | TaggedPoint): moment.Moment => {
  const plantedAt = get(plant, "body.planted_at");
  const createdAt = get(plant, "body.created_at", moment());
  return plantedAt ? moment(plantedAt) : moment(createdAt);
};

/** Compare planted or created date vs time now to determine age. */
export const plantAge = (plant: TaggedPlant | TaggedPoint): number => {
  const currentDate = moment();
  const daysOld = currentDate.diff(plantDate(plant), "days") + 1;
  return daysOld;
};

export function formatPlantInfo(plant: TaggedPlant): FormattedPlantInfo {
  return {
    slug: plant.body.openfarm_slug,
    id: plant.body.id,
    name: plant.body.name,
    daysOld: plantAge(plant),
    x: plant.body.x,
    y: plant.body.y,
    z: plant.body.z,
    radius: plant.body.radius,
    uuid: plant.uuid,
    plantedAt: plantDate(plant),
    plantStatus: get(plant, "body.plant_stage", "planned"),
    meta: plant.kind == "Point" ? plant.body.meta : undefined,
  };
}
