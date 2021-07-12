import * as React from "react";
import { shallow } from "enzyme";
import {
  BotTrail, BotTrailProps, VirtualTrail, resetVirtualTrail,
} from "../bot_trail";
import {
  fakeMapTransformProps,
} from "../../../../../__test_support__/map_transform_props";

describe("<BotTrail/>", () => {
  function fakeProps(): BotTrailProps {
    sessionStorage.setItem(VirtualTrail.records, JSON.stringify([
      { coord: { x: 0, y: 0 }, water: 0 },
      { coord: { x: 1, y: 1 }, water: 10 },
      { coord: { x: 2, y: 2 }, water: 0 },
      { coord: { x: 3, y: 3 }, water: 0 },
      { coord: { x: 4, y: 4 }, water: 20 }]));
    return {
      position: { x: 0, y: 0, z: 0 },
      missedSteps: undefined,
      displayMissedSteps: false,
      mapTransformProps: fakeMapTransformProps(),
      peripherals: [],
    };
  }

  it("shows custom length trail", () => {
    sessionStorage.setItem(VirtualTrail.length, JSON.stringify(5));
    const p = fakeProps();
    p.mapTransformProps.quadrant = 2;
    const wrapper = shallow(<BotTrail {...p} />);
    const lines = wrapper.find(".virtual-bot-trail").find("line");
    expect(lines.length).toEqual(4);
    expect(lines.first().props()).toEqual({
      id: "trail-line-1",
      stroke: "red",
      strokeOpacity: 0.25,
      strokeWidth: 1.5,
      x1: 2, x2: 1, y1: 2, y2: 1
    });
    expect(lines.last().props()).toEqual({
      id: "trail-line-4",
      stroke: "red",
      strokeOpacity: 1,
      strokeWidth: 3,
      x1: 0, x2: 4, y1: 0, y2: 4
    });
  });

  it("shows default length trail", () => {
    sessionStorage.removeItem(VirtualTrail.length);
    const wrapper = shallow(<BotTrail {...fakeProps()} />);
    const lines = wrapper.find(".virtual-bot-trail").find("line");
    expect(lines.length).toEqual(5);
    expect(wrapper.find(".virtual-bot-trail").find("text").length).toEqual(0);
  });

  it("doesn't store duplicate last trail point", () => {
    sessionStorage.removeItem(VirtualTrail.length);
    const p = fakeProps();
    p.position = { x: 4, y: 4, z: 0 };
    const wrapper = shallow(<BotTrail {...p} />);
    const lines = wrapper.find(".virtual-bot-trail").find("line");
    expect(lines.length).toEqual(4);
  });

  it("shows water", () => {
    const wrapper = shallow(<BotTrail {...fakeProps()} />);
    const circles = wrapper.find(".virtual-bot-trail").find("circle");
    expect(circles.length).toEqual(2);
  });

  it("updates water circle size", () => {
    const p = fakeProps();
    p.position = { x: 4, y: 4, z: 0 };
    p.peripherals = [{ label: "water", value: true }];
    const wrapper = shallow(<BotTrail {...p} />);
    const water = wrapper.find(".virtual-bot-trail").find("circle").last();
    expect(water.props().r).toEqual(21);
  });

  it("shows missed step indicators", () => {
    const p = fakeProps();
    p.missedSteps = { x: 60, y: 70, z: 80 };
    p.displayMissedSteps = true;
    const wrapper = shallow(<BotTrail {...p} />);
    expect(wrapper.find(".virtual-bot-trail").find("text").length).toEqual(3);
  });
});

describe("resetVirtualTrail()", () => {
  it("clears data", () => {
    sessionStorage.setItem(VirtualTrail.records, "[1]");
    resetVirtualTrail();
    expect(sessionStorage.getItem(VirtualTrail.records)).toEqual("[]");
  });
});
