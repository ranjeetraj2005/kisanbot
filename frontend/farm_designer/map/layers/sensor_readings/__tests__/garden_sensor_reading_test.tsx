import * as React from "react";
import { shallow } from "enzyme";
import {
  GardenSensorReading, GardenSensorReadingProps,
} from "../garden_sensor_reading";
import {
  fakeSensorReading,
} from "../../../../../__test_support__/fake_state/resources";
import {
  fakeMapTransformProps,
} from "../../../../../__test_support__/map_transform_props";
import {
  fakeTimeSettings,
} from "../../../../../__test_support__/fake_time_settings";
import { svgMount } from "../../../../../__test_support__/svg_mount";

describe("<GardenSensorReading />", () => {
  const fakeProps = (): GardenSensorReadingProps => ({
    sensorReading: fakeSensorReading(),
    mapTransformProps: fakeMapTransformProps(),
    endTime: undefined,
    timeSettings: fakeTimeSettings(),
    sensorLookup: {},
  });

  it("renders", () => {
    const wrapper = svgMount(<GardenSensorReading {...fakeProps()} />);
    expect(wrapper.html()).toContain("sensor-reading-");
    expect(wrapper.find("circle").length).toEqual(2);
  });

  it("doesn't render", () => {
    const p = fakeProps();
    p.sensorReading.body.x = undefined;
    const wrapper = svgMount(<GardenSensorReading {...p} />);
    expect(wrapper.find("circle").length).toEqual(0);
  });

  it("renders sensor name", () => {
    const p = fakeProps();
    p.sensorLookup = { 1: "Sensor Name" };
    const wrapper = svgMount(<GardenSensorReading {...p} />);
    expect(wrapper.text()).toContain("Sensor Name (pin 1)");
  });

  it("renders analog reading", () => {
    const p = fakeProps();
    p.sensorReading.body.mode = 1;
    const wrapper = svgMount(<GardenSensorReading {...p} />);
    expect(wrapper.text()).toContain("value 0 (analog)");
  });

  it("calls hover", () => {
    const wrapper = shallow<GardenSensorReading>(
      <GardenSensorReading {...fakeProps()} />);
    wrapper.find("circle").first().simulate("mouseEnter");
    expect(wrapper.find("text").props().visibility).toEqual("visible");
    expect(wrapper.state().hovered).toEqual(true);
    wrapper.find("circle").first().simulate("mouseLeave");
    expect(wrapper.find("text").props().visibility).toEqual("hidden");
    expect(wrapper.state().hovered).toEqual(false);
  });
});
