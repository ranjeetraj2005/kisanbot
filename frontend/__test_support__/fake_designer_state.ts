import { DesignerState } from "../farm_designer/interfaces";
import { HelpState } from "../help/reducer";

export const fakeDesignerState = (): DesignerState => ({
  selectedPoints: undefined,
  selectionPointType: undefined,
  hoveredPlant: {
    plantUUID: undefined,
    icon: ""
  },
  hoveredPoint: undefined,
  hoveredPlantListItem: undefined,
  hoveredToolSlot: undefined,
  hoveredSensorReading: undefined,
  hoveredImage: undefined,
  cropSearchQuery: "",
  cropSearchResults: [],
  cropSearchInProgress: false,
  chosenLocation: { x: undefined, y: undefined, z: undefined },
  drawnPoint: undefined,
  drawnWeed: undefined,
  openedSavedGarden: undefined,
  tryGroupSortType: undefined,
  editGroupAreaInMap: false,
  visualizedSequence: undefined,
  hoveredSequenceStep: undefined,
  settingsSearchTerm: "",
  hiddenImages: [],
  shownImages: [],
  hideUnShownImages: false,
  alwaysHighlightImage: false,
  hoveredMapImage: undefined,
  cameraViewGridId: undefined,
  gridIds: [],
  soilHeightLabels: false,
  profileOpen: false,
  profileAxis: "x",
  profilePosition: { x: undefined, y: undefined },
  profileWidth: 100,
  profileFollowBot: false,
});

export const fakeHelpState = (): HelpState => ({
  currentTour: undefined,
  currentTourStep: undefined,
});
