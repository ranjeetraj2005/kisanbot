jest.mock("../../history", () => ({ push: jest.fn() }));

import React from "react";
import { mount } from "enzyme";
import {
  RawLocationInfo as LocationInfo, LocationInfoProps, mapStateToProps,
} from "../location_info";
import { fakeState } from "../../__test_support__/fake_state";
import { BooleanSetting } from "../../session_keys";
import { fakeTimeSettings } from "../../__test_support__/fake_time_settings";
import { buildResourceIndex } from "../../__test_support__/resource_index_builder";
import {
  fakeImage, fakePlant, fakePoint, fakeSensor, fakeSensorReading, fakeWebAppConfig,
} from "../../__test_support__/fake_state/resources";
import { tagAsSoilHeight } from "../../points/soil_height";
import { Actions } from "../../constants";
import { push } from "../../history";

describe("<LocationInfo />", () => {
  const fakeProps = (): LocationInfoProps => ({
    chosenLocation: { x: undefined, y: undefined, z: undefined },
    currentBotLocation: { x: undefined, y: undefined, z: undefined },
    botOnline: true,
    dispatch: jest.fn(),
    plants: [fakePlant()],
    genericPoints: [tagAsSoilHeight(fakePoint())],
    sensorReadings: [fakeSensorReading()],
    images: [fakeImage()],
    getConfigValue: jest.fn(),
    env: {},
    sensors: [fakeSensor()],
    timeSettings: fakeTimeSettings(),
    hoveredSensorReading: undefined,
    locked: false,
  });

  it("renders empty panel", () => {
    const wrapper = mount(<LocationInfo {...fakeProps()} />);
    expect(wrapper.text().toLowerCase()).toContain("select a location in the map");
  });

  it("handles missing sensor pin", () => {
    const p = fakeProps();
    p.sensors[0].body.pin = undefined;
    const wrapper = mount(<LocationInfo {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("select a location in the map");
  });

  it("updates query", () => {
    location.search = "?x=123?y=456";
    const p = fakeProps();
    mount(<LocationInfo {...p} />);
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.CHOOSE_LOCATION,
      payload: { x: 123, y: 456, z: 0 },
    });
  });

  it("renders items", () => {
    const p = fakeProps();
    p.chosenLocation = { x: 0, y: 0, z: 0 };
    const wrapper = mount(<LocationInfo {...p} />);
    ["plant", "sensor", "height", "image"].map(string =>
      expect(wrapper.text().toLowerCase()).toContain(string));
  });

  it("handles missing locations", () => {
    const p = fakeProps();
    p.chosenLocation = { x: 0, y: 0, z: 0 };
    const image = fakeImage();
    image.body.meta.x = undefined;
    p.images = [image];
    p.plants = [];
    const point0 = fakePoint();
    tagAsSoilHeight(point0);
    const point1 = fakePoint();
    tagAsSoilHeight(point1);
    p.genericPoints = [point0, point1];
    const wrapper = mount(<LocationInfo {...p} />);
    ["readings (1)", "measurements (1)", "plants (0)", "images (0)"]
      .map(string => expect(wrapper.text().toLowerCase()).toContain(string));
  });

  it("unmounts", () => {
    const p = fakeProps();
    const wrapper = mount(<LocationInfo {...p} />);
    jest.clearAllMocks();
    wrapper.unmount();
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.CHOOSE_LOCATION,
      payload: { x: undefined, y: undefined, z: undefined }
    });
  });

  it("hovers items", () => {
    const p = fakeProps();
    p.chosenLocation = { x: 0, y: 0, z: 0 };
    const plant0 = fakePlant();
    plant0.uuid = "plantUuid";
    const plant1 = fakePlant();
    plant1.uuid = "plantUuid";
    plant1.body.x = 1000;
    plant1.body.y = 1000;
    p.plants = [plant0, plant1];
    const point = tagAsSoilHeight(fakePoint());
    point.uuid = "pointUuid";
    p.genericPoints = [point];
    const reading = fakeSensorReading();
    reading.uuid = "sensorReadingUuid";
    p.sensorReadings = [reading];
    const image = fakeImage();
    image.uuid = "imageUuid";
    p.images = [image];
    const wrapper = mount(<LocationInfo {...p} />);
    wrapper.find(".expandable-header").map(x => x.simulate("click"));
    jest.clearAllMocks();
    wrapper.find(".plant-search-item").simulate("mouseEnter");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.TOGGLE_HOVERED_PLANT,
      payload: { icon: "", plantUUID: "plantUuid" },
    });
    jest.clearAllMocks();
    wrapper.find(".point-search-item").simulate("mouseEnter");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.TOGGLE_HOVERED_POINT, payload: "pointUuid",
    });
    jest.clearAllMocks();
    wrapper.find(".table-row").simulate("mouseEnter");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.HOVER_SENSOR_READING, payload: "sensorReadingUuid",
    });
    jest.clearAllMocks();
    wrapper.find(".image-jsx").simulate("mouseEnter");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.HOVER_IMAGE, payload: "imageUuid",
    });
  });

  it("sets point data", () => {
    const p = fakeProps();
    p.chosenLocation = { x: 1, y: 1, z: 0 };
    p.currentBotLocation = { x: 10, y: 1, z: 0 };
    const wrapper = mount(<LocationInfo {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("9mm from farmbot");
    jest.clearAllMocks();
    wrapper.find(".add-point").simulate("click");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.SET_DRAWN_POINT_DATA,
      payload: { cx: 1, cy: 1 }
    });
    expect(push).toHaveBeenCalledWith("/app/designer/points/add");
  });
});

describe("mapStateToProps()", () => {
  it("returns props", () => {
    const state = fakeState();
    state.resources = buildResourceIndex([fakeWebAppConfig()]);
    const props = mapStateToProps(state);
    expect(props.getConfigValue(BooleanSetting.xy_swap)).toEqual(false);
  });
});
