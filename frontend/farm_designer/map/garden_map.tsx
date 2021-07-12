import React from "react";
import { BooleanSetting } from "../../session_keys";
import { closePlantInfo, unselectPlant } from "./actions";
import {
  MapTransformProps, TaggedPlant, Mode, AxisNumberProperty,
} from "./interfaces";
import { GardenMapProps, GardenMapState } from "../interfaces";
import {
  getMapSize, getGardenCoordinates, getMode, cursorAtPlant, allowInteraction,
} from "./util";
import {
  Grid, MapBackground,
  TargetCoordinate,
  SelectionBox, resizeBox, startNewSelectionBox, maybeUpdateGroup,
} from "./background";
import {
  PlantLayer,
  SpreadLayer,
  PlantRadiusLayer,
  PointLayer,
  WeedLayer,
  ToolSlotLayer,
  FarmBotLayer,
  ImageLayer,
  SensorReadingsLayer,
  ZonesLayer,
  LogsLayer,
} from "./layers";
import { HoveredPlant, ActivePlantDragHelper } from "./active_plant";
import { DrawnPoint, startNewPoint, resizePoint } from "./drawn_point";
import { Bugs, showBugs } from "./easter_eggs/bugs";
import {
  dropPlant, dragPlant, beginPlantDrag, maybeSavePlantLocation,
} from "./layers/plants/plant_actions";
import { chooseLocation } from "../move_to";
import { GroupOrder, NNPath } from "./group_order_visual";
import { history } from "../../history";
import { ErrorBoundary } from "../../error_boundary";
import { TaggedPoint, TaggedPointGroup, PointType } from "farmbot";
import { findGroupFromUrl } from "../../point_groups/group_detail";
import { pointsSelectedByGroup } from "../../point_groups/criteria";
import { DrawnWeed } from "./drawn_point/drawn_weed";
import { UUID } from "../../resources/interfaces";
import { throttle } from "lodash";
import { SequenceVisualization } from "./sequence_visualization";
import { chooseProfile, ProfileLine } from "./profile";

export class GardenMap extends
  React.Component<GardenMapProps, Partial<GardenMapState>> {
  state: Partial<GardenMapState> = {};
  constructor(props: GardenMapProps) {
    super(props);
    this.state = {};
  }

  componentWillUnmount() {
    // Clear plant selection when navigating away from the designer.
    unselectPlant(this.props.dispatch)();
  }

  /** Props needed for placement of items in the map. */
  get mapTransformProps(): MapTransformProps {
    return this.props.mapTransformProps;
  }

  get gridSize() { return this.mapTransformProps.gridSize; }

  get mapSize() {
    return getMapSize(this.mapTransformProps, this.props.gridOffset);
  }
  get xySwap() { return this.mapTransformProps.xySwap; }

  /** Currently editing a plant? */
  get isEditing(): boolean { return getMode() === Mode.editPlant; }

  /** Display plant animations? */
  get animate(): boolean {
    return !this.props.getConfigValue(BooleanSetting.disable_animations);
  }
  get group(): TaggedPointGroup | undefined {
    return findGroupFromUrl(this.props.groups);
  }

  get pointsSelectedByGroup(): TaggedPoint[] {
    return this.group
      ? pointsSelectedByGroup(this.group, this.props.allPoints)
      : [];
  }

  get groupSelected(): UUID[] {
    return this.pointsSelectedByGroup.map(point => point.uuid);
  }

  /** Save the current plant (if needed) and reset drag state. */
  endDrag = throttle(() => {
    maybeSavePlantLocation({
      plant: this.getPlant(),
      isDragging: this.state.isDragging,
      dispatch: this.props.dispatch,
    });
    maybeUpdateGroup({
      selectionBox: this.state.selectionBox,
      group: this.group,
      dispatch: this.props.dispatch,
      editGroupAreaInMap: this.props.designer.editGroupAreaInMap,
      boxSelected: this.props.designer.selectedPoints,
    });
    this.setState({
      isDragging: false, qPageX: 0, qPageY: 0,
      activeDragXY: { x: undefined, y: undefined, z: undefined },
      activeDragSpread: undefined,
      selectionBox: undefined
    });
  }, 400);

  getGardenCoordinates =
    (e: React.DragEvent<HTMLElement> | React.MouseEvent<SVGElement>):
      AxisNumberProperty | undefined => {
      return getGardenCoordinates({
        mapTransformProps: this.mapTransformProps,
        gridOffset: this.props.gridOffset,
        pageX: e.pageX,
        pageY: e.pageY,
      });
    };

  setMapState = (x: Partial<GardenMapState>) => this.setState(x);

  /** Map (anywhere) drag start actions. */
  startDrag = (e: React.MouseEvent<SVGElement>): void => {
    switch (getMode()) {
      case Mode.editPlant:
        const gardenCoords = this.getGardenCoordinates(e);
        const plant = this.getPlant();
        if (cursorAtPlant(plant, gardenCoords)) {
          beginPlantDrag({
            plant,
            setMapState: this.setMapState,
            selectedPlant: this.props.selectedPlant,
          });
        } else { // Actions away from plant exit plant edit mode.
          this.closePanel()();
          startNewSelectionBox({
            gardenCoords,
            setMapState: this.setMapState,
            dispatch: this.props.dispatch,
            plantActions: true,
          });
        }
        break;
      case Mode.editGroup:
        startNewSelectionBox({
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: !this.props.designer.editGroupAreaInMap,
        });
        break;
      case Mode.createPoint:
        startNewPoint({
          gardenCoords: this.getGardenCoordinates(e),
          dispatch: this.props.dispatch,
          setMapState: this.setMapState,
          type: "point",
        });
        break;
      case Mode.createWeed:
        startNewPoint({
          gardenCoords: this.getGardenCoordinates(e),
          dispatch: this.props.dispatch,
          setMapState: this.setMapState,
          type: "weed",
        });
        break;
      case Mode.clickToAdd:
        break;
    }
  }

  /** Map background drag start actions. */
  startDragOnBackground = (e: React.MouseEvent<SVGElement>): void => {
    switch (getMode()) {
      case Mode.moveTo:
      case Mode.locationInfo:
      case Mode.createPoint:
      case Mode.createWeed:
      case Mode.clickToAdd:
      case Mode.editPlant:
      case Mode.profile:
        break;
      case Mode.boxSelect:
        startNewSelectionBox({
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: true,
        });
        break;
      case Mode.editGroup:
        startNewSelectionBox({
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: !this.props.designer.editGroupAreaInMap,
        });
        break;
      default:
        history.push("/app/designer/plants");
        startNewSelectionBox({
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: true,
        });
        break;
    }
  }

  interactions = (pointerType: PointType): boolean => {
    if (allowInteraction()) {
      switch (getMode()) {
        case Mode.editGroup:
        case Mode.boxSelect:
          return (this.props.designer.selectionPointType || ["Plant"])
            .includes(pointerType);
      }
    }
    return allowInteraction();
  };

  /** Return the selected plant, mode-allowing. */
  getPlant = (): TaggedPlant | undefined => {
    return allowInteraction()
      ? this.props.selectedPlant
      : undefined;
  }

  get currentPoint(): UUID | undefined {
    return this.props.designer.selectedPoints?.[0];
  }

  handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    switch (getMode()) {
      case Mode.addPlant:
      case Mode.clickToAdd:
        e.preventDefault(); // Allows dragged-in plants to be placed in the map
        e.dataTransfer.dropEffect = "move";
    }
  }

  handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    switch (getMode()) {
      case Mode.addPlant:
        e.preventDefault();
    }
  }

  handleDrop =
    (e: React.DragEvent<HTMLElement> | React.MouseEvent<SVGElement>) => {
      e.preventDefault();
      dropPlant({
        gardenCoords: this.getGardenCoordinates(e),
        cropSearchResults: this.props.designer.cropSearchResults,
        openedSavedGarden: this.props.designer.openedSavedGarden,
        gridSize: this.mapTransformProps.gridSize,
        dispatch: this.props.dispatch,
      });
    };

  click = (e: React.MouseEvent<SVGElement>) => {
    switch (getMode()) {
      case Mode.clickToAdd:
        // Create a new plant in the map
        this.handleDrop(e);
        break;
      case Mode.moveTo:
      case Mode.locationInfo:
        e.preventDefault();
        chooseLocation({
          gardenCoords: this.getGardenCoordinates(e),
          dispatch: this.props.dispatch
        });
        break;
      case Mode.profile:
        // Choose profile location
        e.preventDefault();
        chooseProfile({
          gardenCoords: this.getGardenCoordinates(e),
          dispatch: this.props.dispatch
        });
        break;
    }
  }

  /** Map drag actions. */
  drag = (e: React.MouseEvent<SVGElement>) => {
    switch (getMode()) {
      case Mode.editPlant:
        dragPlant({
          getPlant: this.getPlant,
          mapTransformProps: this.mapTransformProps,
          isDragging: this.state.isDragging,
          dispatch: this.props.dispatch,
          setMapState: this.setMapState,
          qPageX: this.state.qPageX,
          qPageY: this.state.qPageY,
          pageX: e.pageX,
          pageY: e.pageY,
        });
        break;
      case Mode.createPoint:
        resizePoint({
          gardenCoords: this.getGardenCoordinates(e),
          drawnPoint: this.props.designer.drawnPoint,
          dispatch: this.props.dispatch,
          isDragging: this.state.isDragging,
          type: "point",
        });
        break;
      case Mode.createWeed:
        resizePoint({
          gardenCoords: this.getGardenCoordinates(e),
          drawnPoint: this.props.designer.drawnWeed,
          dispatch: this.props.dispatch,
          isDragging: this.state.isDragging,
          type: "weed",
        });
        break;
      case Mode.editGroup:
        resizeBox({
          selectionBox: this.state.selectionBox,
          plants: this.props.plants,
          allPoints: this.props.allPoints,
          selectionPointType: this.props.designer.selectionPointType,
          getConfigValue: this.props.getConfigValue,
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: !this.props.designer.editGroupAreaInMap,
        });
        break;
      case Mode.boxSelect:
      default:
        resizeBox({
          selectionBox: this.state.selectionBox,
          plants: this.props.plants,
          allPoints: this.props.allPoints,
          selectionPointType: this.props.designer.selectionPointType,
          getConfigValue: this.props.getConfigValue,
          gardenCoords: this.getGardenCoordinates(e),
          setMapState: this.setMapState,
          dispatch: this.props.dispatch,
          plantActions: true,
        });
        break;
    }
  }

  /** Return to garden (unless selecting more plants). */
  closePanel = () => {
    switch (getMode()) {
      case Mode.moveTo:
      case Mode.locationInfo:
      case Mode.profile:
        return () => { };
      case Mode.boxSelect:
        return this.props.designer.selectedPoints
          ? () => { }
          : closePlantInfo(this.props.dispatch);
      default:
        return closePlantInfo(this.props.dispatch);
    }
  }

  mapDropAreaProps = () => ({
    onDrop: this.handleDrop,
    onDragEnter: this.handleDragEnter,
    onDragOver: this.handleDragOver,
    onMouseLeave: this.endDrag,
    onMouseUp: this.endDrag,
    onDragEnd: this.endDrag,
    onDragStart: (e: React.DragEvent<HTMLElement>) => e.preventDefault(),
    style: {
      height: this.mapSize.h + "px", maxHeight: this.mapSize.h + "px",
      width: this.mapSize.w + "px", maxWidth: this.mapSize.w + "px"
    },
  });
  MapBackground = () => <MapBackground
    templateView={!!this.props.designer.openedSavedGarden}
    mapTransformProps={this.mapTransformProps}
    plantAreaOffset={this.props.gridOffset} />
  svgDropAreaProps = () => ({
    x: this.props.gridOffset.x,
    y: this.props.gridOffset.y,
    width: this.xySwap ? this.gridSize.y : this.gridSize.x,
    height: this.xySwap ? this.gridSize.x : this.gridSize.y,
    onMouseUp: this.endDrag,
    onMouseDown: this.startDrag,
    onMouseMove: this.drag,
    onClick: this.click,
  });
  ImageLayer = () => <ImageLayer
    images={this.props.latestImages}
    hiddenImages={this.props.designer.hiddenImages}
    shownImages={this.props.designer.shownImages}
    hideUnShownImages={this.props.designer.hideUnShownImages}
    alwaysHighlightImage={this.props.designer.alwaysHighlightImage}
    hoveredMapImage={this.props.designer.hoveredMapImage}
    cameraCalibrationData={this.props.cameraCalibrationData}
    visible={!!this.props.showImages}
    mapTransformProps={this.mapTransformProps}
    getConfigValue={this.props.getConfigValue} />
  LogsLayer = () => <LogsLayer
    logs={this.props.logs}
    cameraCalibrationData={this.props.cameraCalibrationData}
    deviceTarget={this.props.deviceTarget}
    visible={!!this.props.showImages}
    mapTransformProps={this.mapTransformProps}
    getConfigValue={this.props.getConfigValue} />
  Grid = () => <Grid
    onClick={this.closePanel()}
    onMouseDown={this.startDragOnBackground}
    mapTransformProps={this.mapTransformProps}
    zoomLvl={this.props.zoomLvl} />
  ZonesLayer = () => <ZonesLayer
    visible={!!this.props.showZones}
    botSize={this.props.botSize}
    mapTransformProps={this.mapTransformProps}
    groups={this.props.groups}
    startDrag={this.startDragOnBackground}
    currentGroup={this.group?.uuid} />
  ProfileLine = () => <ProfileLine
    designer={this.props.designer}
    botPosition={this.props.botLocationData.position}
    plantAreaOffset={this.props.gridOffset}
    mapTransformProps={this.mapTransformProps} />
  SensorReadingsLayer = () => <SensorReadingsLayer
    visible={!!this.props.showSensorReadings}
    sensorReadings={this.props.sensorReadings}
    mapTransformProps={this.mapTransformProps}
    timeSettings={this.props.timeSettings}
    sensors={this.props.sensors} />
  SpreadLayer = () => <SpreadLayer
    mapTransformProps={this.mapTransformProps}
    plants={this.props.plants}
    currentPlant={this.getPlant()}
    visible={!!this.props.showSpread}
    dragging={!!this.state.isDragging}
    zoomLvl={this.props.zoomLvl}
    activeDragXY={this.state.activeDragXY}
    activeDragSpread={this.state.activeDragSpread}
    editing={this.isEditing}
    animate={this.animate} />
  PlantRadiusLayer = () => <PlantRadiusLayer
    visible={!!this.props.showPlants}
    mapTransformProps={this.mapTransformProps}
    plants={this.props.plants}
    animate={this.animate} />
  PointLayer = () => <PointLayer
    mapTransformProps={this.mapTransformProps}
    dispatch={this.props.dispatch}
    designer={this.props.designer}
    visible={!!this.props.showPoints}
    cameraCalibrationData={this.props.cameraCalibrationData}
    cropPhotos={!!this.props.getConfigValue(BooleanSetting.crop_images)}
    interactions={this.interactions("GenericPointer")}
    genericPoints={this.props.genericPoints} />
  WeedLayer = () => <WeedLayer
    mapTransformProps={this.mapTransformProps}
    dispatch={this.props.dispatch}
    hoveredPoint={this.props.designer.hoveredPoint}
    visible={!!this.props.showWeeds}
    radiusVisible={true}
    currentPoint={this.currentPoint}
    boxSelected={this.props.designer.selectedPoints}
    groupSelected={this.groupSelected}
    interactions={this.interactions("Weed")}
    weeds={this.props.weeds}
    animate={this.animate} />
  PlantLayer = () => <PlantLayer
    mapTransformProps={this.mapTransformProps}
    dispatch={this.props.dispatch}
    visible={!!this.props.showPlants}
    plants={this.props.plants}
    currentPlant={this.getPlant()}
    hoveredPlant={this.props.hoveredPlant}
    dragging={!!this.state.isDragging}
    editing={this.isEditing}
    boxSelected={this.props.designer.selectedPoints}
    groupSelected={this.groupSelected}
    zoomLvl={this.props.zoomLvl}
    activeDragXY={this.state.activeDragXY}
    interactions={this.interactions("Plant")}
    animate={this.animate} />
  ToolSlotLayer = () => <ToolSlotLayer
    mapTransformProps={this.mapTransformProps}
    visible={!!this.props.showFarmbot}
    dispatch={this.props.dispatch}
    hoveredToolSlot={this.props.designer.hoveredToolSlot}
    botPositionX={this.props.botLocationData.position.x}
    interactions={this.interactions("ToolSlot")}
    slots={this.props.toolSlots} />
  FarmBotLayer = () => <FarmBotLayer
    mapTransformProps={this.mapTransformProps}
    visible={!!this.props.showFarmbot}
    botLocationData={this.props.botLocationData}
    stopAtHome={this.props.stopAtHome}
    botSize={this.props.botSize}
    plantAreaOffset={this.props.gridOffset}
    peripherals={this.props.peripherals}
    eStopStatus={this.props.eStopStatus}
    mountedToolInfo={this.props.mountedToolInfo}
    cameraCalibrationData={this.props.cameraCalibrationData}
    getConfigValue={this.props.getConfigValue} />
  HoveredPlant = () => <HoveredPlant
    visible={!!this.props.showPlants}
    spreadLayerVisible={!!this.props.showSpread}
    isEditing={this.isEditing}
    mapTransformProps={this.mapTransformProps}
    currentPlant={this.getPlant()}
    designer={this.props.designer}
    hoveredPlant={this.props.hoveredPlant}
    dragging={!!this.state.isDragging}
    animate={this.animate} />
  DragHelper = () => <ActivePlantDragHelper
    mapTransformProps={this.mapTransformProps}
    currentPlant={this.getPlant()}
    dragging={!!this.state.isDragging}
    editing={this.isEditing}
    zoomLvl={this.props.zoomLvl}
    activeDragXY={this.state.activeDragXY}
    plantAreaOffset={this.props.gridOffset} />
  SelectionBox = () => <SelectionBox
    selectionBox={this.state.selectionBox}
    mapTransformProps={this.mapTransformProps} />
  TargetCoordinate = () => <TargetCoordinate
    chosenLocation={this.props.designer.chosenLocation}
    hoveredPlant={this.props.hoveredPlant}
    hoveredSensorReading={this.props.sensorReadings.filter(reading =>
      reading.uuid == this.props.designer.hoveredSensorReading)[0]}
    hoveredImage={this.props.latestImages.filter(image =>
      image.uuid == this.props.designer.hoveredImage)[0]}
    hoveredPoint={this.props.allPoints.filter(point =>
      point.uuid == this.props.designer.hoveredPoint)[0]}
    mapTransformProps={this.mapTransformProps} />
  DrawnPoint = () => <DrawnPoint
    data={this.props.designer.drawnPoint}
    mapTransformProps={this.mapTransformProps} />
  DrawnWeed = () => <DrawnWeed
    data={this.props.designer.drawnWeed}
    mapTransformProps={this.mapTransformProps} />
  GroupOrder = () => <GroupOrder
    group={this.group}
    groupPoints={this.pointsSelectedByGroup}
    zoomLvl={this.props.zoomLvl}
    mapTransformProps={this.mapTransformProps} />
  SequenceVisualization = () => <SequenceVisualization
    botPosition={this.props.botLocationData.position}
    zoomLvl={this.props.zoomLvl}
    visualizedSequenceUUID={this.props.designer.visualizedSequence}
    visualizedSequenceBody={this.props.visualizedSequenceBody}
    hoveredSequenceStep={this.props.designer.hoveredSequenceStep}
    dispatch={this.props.dispatch}
    mapTransformProps={this.mapTransformProps} />
  NNPath = () => <NNPath pathPoints={this.props.allPoints}
    mapTransformProps={this.mapTransformProps} />
  Bugs = () => showBugs()
    ? <Bugs mapTransformProps={this.mapTransformProps}
      botSize={this.props.botSize} />
    : <g />

  /** Render layers in order from back to front. */
  render() {
    return <div className={"drop-area"} {...this.mapDropAreaProps()}>
      <ErrorBoundary>
        <svg id={"map-background-svg"}>
          <this.MapBackground />
          <svg className={"drop-area-svg"} {...this.svgDropAreaProps()}>
            <this.ImageLayer />
            <this.LogsLayer />
            <this.Grid />
            <this.ZonesLayer />
            <this.ProfileLine />
            <this.SensorReadingsLayer />
            <this.SpreadLayer />
            <this.PlantRadiusLayer />
            <this.PointLayer />
            <this.WeedLayer />
            <this.PlantLayer />
            <this.ToolSlotLayer />
            <this.FarmBotLayer />
            <this.HoveredPlant />
            <this.DragHelper />
            <this.SelectionBox />
            <this.TargetCoordinate />
            <this.DrawnPoint />
            <this.DrawnWeed />
            <this.GroupOrder />
            <this.SequenceVisualization />
            <this.NNPath />
            <this.Bugs />
          </svg>
        </svg>
      </ErrorBoundary>
    </div>;
  }
}
