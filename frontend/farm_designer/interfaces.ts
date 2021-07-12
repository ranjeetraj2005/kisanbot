import { OpenFarm } from "../open_farm/openfarm";
import { DropDownItem } from "../ui";
import { CowardlyDictionary } from "../util";
import {
  TaggedFarmEvent,
  TaggedSequence,
  TaggedRegimen,
  TaggedGenericPointer,
  TaggedImage,
  TaggedSensorReading,
  TaggedSensor,
  TaggedPoint,
  TaggedPointGroup,
  TaggedWeedPointer,
  PointType,
  SequenceBodyItem,
  McuParams,
  TaggedCrop,
  TaggedLog,
  TaggedTool,
} from "farmbot";
import { SlotWithTool, ResourceIndex, UUID } from "../resources/interfaces";
import {
  BotPosition, BotLocationData, ShouldDisplay, SourceFbosConfig,
} from "../devices/interfaces";
import { isNumber } from "lodash";
import {
  AxisNumberProperty, BotSize, MapTransformProps, TaggedPlant,
} from "./map/interfaces";
import { SelectionBoxData } from "./map/background";
import { GetWebAppConfigValue } from "../config_storage/actions";
import {
  ExecutableType, PlantPointer, ToolPulloutDirection,
} from "farmbot/dist/resources/api_resources";
import { BooleanConfigKey } from "farmbot/dist/resources/configs/web_app";
import { TimeSettings } from "../interfaces";
import { ExtendedPointGroupSortType } from "../point_groups/paths";

/* BotOriginQuadrant diagram

2 --- 1
|     |
3 --- 4

*/
export enum BotOriginQuadrant { ONE = 1, TWO = 2, THREE = 3, FOUR = 4 }

type Mystery = BotOriginQuadrant | number | string | boolean | undefined;
export function isBotOriginQuadrant(mystery: Mystery):
  mystery is BotOriginQuadrant {
  return isNumber(mystery) && [1, 2, 3, 4].includes(mystery);
}

type TypeCheckerHint = Partial<Record<BooleanConfigKey, boolean>>;

export interface State extends TypeCheckerHint {
  legend_menu_open: boolean;
  show_plants: boolean;
  show_points: boolean;
  show_weeds: boolean;
  show_spread: boolean;
  show_farmbot: boolean;
  show_images: boolean;
  show_zones: boolean;
  show_sensor_readings: boolean;
  bot_origin_quadrant: BotOriginQuadrant;
  zoom_level: number;
}

export interface MountedToolInfo {
  name: string | undefined;
  pulloutDirection: ToolPulloutDirection | undefined;
  noUTM: boolean;
  flipped: boolean;
}

export interface FarmDesignerProps {
  dispatch: Function;
  selectedPlant: TaggedPlant | undefined;
  designer: DesignerState;
  hoveredPlant: TaggedPlant | undefined;
  genericPoints: TaggedGenericPointer[];
  weeds: TaggedWeedPointer[];
  allPoints: TaggedPoint[];
  plants: TaggedPlant[];
  tools: TaggedTool[];
  toolSlots: SlotWithTool[];
  crops: TaggedCrop[];
  botLocationData: BotLocationData;
  botMcuParams: McuParams;
  botSize: BotSize;
  peripherals: { label: string, value: boolean }[];
  eStopStatus: boolean;
  latestImages: TaggedImage[];
  cameraCalibrationData: CameraCalibrationData;
  timeSettings: TimeSettings;
  getConfigValue: GetWebAppConfigValue;
  sensorReadings: TaggedSensorReading[];
  sensors: TaggedSensor[];
  groups: TaggedPointGroup[];
  shouldDisplay: ShouldDisplay;
  mountedToolInfo: MountedToolInfo;
  visualizedSequenceBody: SequenceBodyItem[];
  logs: TaggedLog[];
  deviceTarget: string;
  sourceFbosConfig: SourceFbosConfig;
}

export interface MovePlantProps {
  deltaX: number;
  deltaY: number;
  plant: TaggedPlant;
  gridSize: AxisNumberProperty;
}

/**
 * OFCrop bundled with corresponding profile image from OpenFarm API.
 */
export interface CropLiveSearchResult {
  crop: OpenFarm.OFCrop;
  image: string;
}

export interface Crop {
  id?: undefined;
  svg_icon?: string | undefined;
  spread?: number | undefined;
  slug: string;
}

export interface DesignerState {
  selectedPoints: UUID[] | undefined;
  selectionPointType: PointType[] | undefined;
  hoveredPlant: HoveredPlantPayl;
  hoveredPoint: string | undefined;
  hoveredPlantListItem: string | undefined;
  hoveredToolSlot: string | undefined;
  hoveredSensorReading: string | undefined;
  hoveredImage: string | undefined;
  cropSearchQuery: string;
  cropSearchResults: CropLiveSearchResult[];
  cropSearchInProgress: boolean;
  chosenLocation: BotPosition;
  drawnPoint: DrawnPointPayl | undefined;
  drawnWeed: DrawnWeedPayl | undefined;
  openedSavedGarden: string | undefined;
  tryGroupSortType: ExtendedPointGroupSortType | undefined;
  editGroupAreaInMap: boolean;
  visualizedSequence: UUID | undefined;
  hoveredSequenceStep: string | undefined;
  settingsSearchTerm: string;
  hiddenImages: number[];
  shownImages: number[];
  hideUnShownImages: boolean;
  alwaysHighlightImage: boolean;
  hoveredMapImage: number | undefined;
  cameraViewGridId: string | undefined;
  gridIds: string[];
  soilHeightLabels: boolean;
  profileOpen: boolean;
  profileAxis: "x" | "y";
  profilePosition: Record<"x" | "y", number | undefined>;
  profileWidth: number;
  profileFollowBot: boolean;
}

export type TaggedExecutable = TaggedSequence | TaggedRegimen;
export type ExecutableQuery = (kind: ExecutableType, id: number) => TaggedExecutable;
export interface AddEditFarmEventProps {
  deviceTimezone: string | undefined;
  executableOptions: DropDownItem[];
  repeatOptions: DropDownItem[];
  farmEvents: TaggedFarmEvent[];
  regimensById: CowardlyDictionary<TaggedRegimen>;
  sequencesById: CowardlyDictionary<TaggedSequence>;
  farmEventsById: CowardlyDictionary<TaggedFarmEvent>;
  getFarmEvent(): TaggedFarmEvent | undefined;
  findFarmEventByUuid(uuid: string | undefined): TaggedFarmEvent | undefined;
  handleTime(e: React.SyntheticEvent<HTMLInputElement>, currentISO: string): string;
  dispatch: Function;
  findExecutable: ExecutableQuery;
  timeSettings: TimeSettings;
  resources: ResourceIndex;
}

/**
 * One CalendarDay has many CalendarOccurrences. For instance, a FarmEvent
 * that executes every 8 hours will create 3 CalendarOccurrences in a single
 * CalendarDay.
 */
export interface CalendarOccurrence {
  mmddyy: string;
  sortKey: number;
  timeStr: string;
  heading: string;
  subheading?: string | undefined;
  executableId: number;
  id: number;
  color?: string;
}

/** A group of FarmEvents for a particular day on the calendar. */
export interface CalendarDay {
  /** Unix timestamp. Used as a unique key in JSX and for sorting. */
  sortKey: number;
  year: number;
  month: string;
  day: number;
  /** Every event that will execute on that day. */
  items: CalendarOccurrence[];
}

export interface FarmEventProps {
  timezoneIsSet: boolean;
  /** Sorted list of the first (100?) events due on the calendar. */
  calendarRows: CalendarDay[];
}

export interface FarmEventState {
  searchTerm: string;
}

export interface GardenMapProps {
  showPlants: boolean | undefined;
  showPoints: boolean | undefined;
  showWeeds: boolean | undefined;
  showSpread: boolean | undefined;
  showFarmbot: boolean | undefined;
  showImages: boolean | undefined;
  showZones: boolean | undefined;
  showSensorReadings: boolean | undefined;
  dispatch: Function;
  designer: DesignerState;
  genericPoints: TaggedGenericPointer[];
  weeds: TaggedWeedPointer[];
  allPoints: TaggedPoint[];
  plants: TaggedPlant[];
  toolSlots: SlotWithTool[];
  selectedPlant: TaggedPlant | undefined;
  hoveredPlant: TaggedPlant | undefined;
  crops: TaggedCrop[];
  botLocationData: BotLocationData;
  botSize: BotSize;
  stopAtHome: Record<"x" | "y", boolean>;
  zoomLvl: number;
  mapTransformProps: MapTransformProps;
  gridOffset: AxisNumberProperty;
  peripherals: { label: string, value: boolean }[];
  eStopStatus: boolean;
  latestImages: TaggedImage[];
  cameraCalibrationData: CameraCalibrationData;
  getConfigValue: GetWebAppConfigValue;
  sensorReadings: TaggedSensorReading[];
  sensors: TaggedSensor[];
  timeSettings: TimeSettings;
  groups: TaggedPointGroup[];
  mountedToolInfo: MountedToolInfo;
  visualizedSequenceBody: SequenceBodyItem[];
  logs: TaggedLog[];
  deviceTarget: string;
}

export interface GardenMapState {
  isDragging: boolean | undefined;
  botOriginQuadrant: BotOriginQuadrant;
  qPageX: number | undefined;
  qPageY: number | undefined;
  activeDragXY: BotPosition | undefined;
  activeDragSpread: number | undefined;
  selectionBox: SelectionBoxData | undefined;
}

export type PlantOptions = Partial<PlantPointer>;

export interface EditPlantInfoProps {
  push(url: string): void;
  dispatch: Function;
  findPlant(stringyID: string | undefined): TaggedPlant | undefined;
  openedSavedGarden: string | undefined;
  timeSettings: TimeSettings;
  getConfigValue: GetWebAppConfigValue;
}

export interface DraggableEvent {
  currentTarget: HTMLImageElement;
  dataTransfer: {
    setDragImage: Function;
  };
}

export interface HoveredPlantPayl {
  plantUUID: string | undefined;
  icon: string;
}

export type OpenfarmSearch = (query: string) => (dispatch: Function) => void;

export interface CropCatalogProps {
  cropSearchQuery: string;
  dispatch: Function;
  cropSearchResults: CropLiveSearchResult[];
  openfarmSearch: OpenfarmSearch;
  cropSearchInProgress: boolean;
}

export interface CropInfoProps {
  dispatch: Function;
  cropSearchQuery: string | undefined;
  cropSearchResults: CropLiveSearchResult[];
  cropSearchInProgress: boolean;
  openedSavedGarden: string | undefined;
  openfarmSearch: OpenfarmSearch;
  botPosition: BotPosition;
}

export interface CameraCalibrationData {
  scale: string | undefined;
  rotation: string | undefined;
  offset: {
    x: string | undefined;
    y: string | undefined;
  },
  center: {
    x: string | undefined;
    y: string | undefined;
  },
  origin: string | undefined;
  calibrationZ: string | undefined;
}

export interface DrawnPointPayl {
  name?: string;
  cx: number;
  cy: number;
  z: number;
  r: number;
  color?: string;
  at_soil_level?: boolean;
}

export interface DrawnWeedPayl {
  name?: string;
  cx: number;
  cy: number;
  z: number;
  r: number;
  color?: string;
}
