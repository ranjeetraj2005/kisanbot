let mockPath = "/app/designer/plants";
jest.mock("../../../../../history", () => ({
  getPathArray: jest.fn(() => mockPath.split("/")),
}));

import React from "react";
import { PointLayer, PointLayerProps } from "../point_layer";
import { fakePoint } from "../../../../../__test_support__/fake_state/resources";
import {
  fakeMapTransformProps,
} from "../../../../../__test_support__/map_transform_props";
import { GardenPoint } from "../garden_point";
import { svgMount } from "../../../../../__test_support__/svg_mount";
import {
  fakeCameraCalibrationData,
} from "../../../../../__test_support__/fake_camera_data";
import {
  fakeDesignerState,
} from "../../../../../__test_support__/fake_designer_state";
import { tagAsSoilHeight } from "../../../../../points/soil_height";

describe("<PointLayer/>", () => {
  const fakeProps = (): PointLayerProps => ({
    visible: true,
    genericPoints: [fakePoint()],
    mapTransformProps: fakeMapTransformProps(),
    designer: fakeDesignerState(),
    dispatch: jest.fn(),
    interactions: true,
    cameraCalibrationData: fakeCameraCalibrationData(),
    cropPhotos: false,
  });

  it("shows points", () => {
    const p = fakeProps();
    p.interactions = false;
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find(GardenPoint).html()).toContain("r=\"100\"");
    expect(layer.props().style).toEqual({ pointerEvents: "none" });
  });

  it("toggles visibility off", () => {
    const p = fakeProps();
    p.visible = false;
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find(GardenPoint).length).toEqual(0);
  });

  it("allows point mode interaction", () => {
    mockPath = "/app/designer/points";
    const p = fakeProps();
    p.interactions = true;
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.props().style).toEqual({});
  });

  it("shows grid points", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    p.genericPoints = [fakePoint(), gridPoint];
    p.designer.gridIds = [];
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find(GardenPoint).length).toEqual(2);
  });

  it("hides grid points", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    p.genericPoints = [fakePoint(), gridPoint];
    p.designer.gridIds = ["123"];
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find(GardenPoint).length).toEqual(1);
  });

  it("shows empty interpolation map", () => {
    mockPath = "/app/designer/location";
    const wrapper = svgMount(<PointLayer {...fakeProps()} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find("#interpolation-map").length).toEqual(1);
    expect(layer.find("rect").length).toEqual(0);
  });

  it("shows interpolation map", () => {
    mockPath = "/app/designer/location";
    const p = fakeProps();
    tagAsSoilHeight(p.genericPoints[0]);
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find("#interpolation-map").length).toEqual(1);
    expect(layer.find("rect").length).toEqual(450);
  });

  it("shows interpolation map in quadrant 4", () => {
    mockPath = "/app/designer/location";
    const p = fakeProps();
    p.mapTransformProps.quadrant = 4;
    tagAsSoilHeight(p.genericPoints[0]);
    const wrapper = svgMount(<PointLayer {...p} />);
    const layer = wrapper.find("#point-layer");
    expect(layer.find("#interpolation-map").length).toEqual(1);
    expect(layer.find("rect").length).toEqual(450);
  });
});
