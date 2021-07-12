jest.mock("../../../../history", () => ({
  history: { push: jest.fn() },
  getPathArray: () => [],
  push: jest.fn(),
}));

let mockAtMax = false;
let mockAtMin = false;
jest.mock("../../zoom", () => ({
  atMaxZoom: () => mockAtMax,
  atMinZoom: () => mockAtMin,
}));

jest.mock("../../../../config_storage/actions", () => ({
  getWebAppConfigValue: jest.fn(() => jest.fn()),
  setWebAppConfigValue: jest.fn(),
}));

let mockDev = false;
jest.mock("../../../../settings/dev/dev_support", () => ({
  DevSettings: { futureFeaturesEnabled: () => mockDev }
}));

import React from "react";
import { shallow, mount } from "enzyme";
import {
  GardenMapLegend, ZoomControls, PointsSubMenu, FarmbotSubMenu,
} from "../garden_map_legend";
import { GardenMapLegendProps } from "../../interfaces";
import { BooleanSetting } from "../../../../session_keys";
import {
  fakeTimeSettings,
} from "../../../../__test_support__/fake_time_settings";
import { setWebAppConfigValue } from "../../../../config_storage/actions";
import {
  fakeBotLocationData, fakeBotSize,
} from "../../../../__test_support__/fake_bot_data";
import {
  fakeFirmwareConfig,
} from "../../../../__test_support__/fake_state/resources";
import { push } from "../../../../history";

describe("<GardenMapLegend />", () => {
  const fakeProps = (): GardenMapLegendProps => ({
    zoom: () => () => undefined,
    toggle: () => () => undefined,
    legendMenuOpen: true,
    showPlants: false,
    showPoints: false,
    showWeeds: false,
    showSpread: false,
    showFarmbot: false,
    showImages: false,
    showZones: false,
    showSensorReadings: false,
    hasSensorReadings: false,
    dispatch: jest.fn(),
    timeSettings: fakeTimeSettings(),
    getConfigValue: jest.fn(),
    imageAgeInfo: { newestDate: "", toOldest: 1 },
    allPoints: [],
    sourceFbosConfig: () => ({ value: 0, consistent: true }),
    firmwareConfig: fakeFirmwareConfig().body,
    botLocationData: fakeBotLocationData(),
    botSize: fakeBotSize(),
  });

  it("renders", () => {
    const wrapper = mount(<GardenMapLegend {...fakeProps()} />);
    ["plants", "move"].map(string =>
      expect(wrapper.text().toLowerCase()).toContain(string));
    expect(wrapper.html()).toContain("filter");
    expect(wrapper.html()).toContain("extras");
    expect(wrapper.html()).not.toContain("-100");
  });

  it("renders with readings", () => {
    const p = fakeProps();
    p.hasSensorReadings = true;
    const wrapper = mount(<GardenMapLegend {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("readings");
  });

  it("renders z display", () => {
    const wrapper = mount(<GardenMapLegend {...fakeProps()} />);
    wrapper.find(".fb-toggle-button").last().simulate("click");
    expect(wrapper.html()).toContain("-100");
  });

  it("renders location info button", () => {
    mockDev = true;
    const wrapper = mount(<GardenMapLegend {...fakeProps()} />);
    wrapper.find(".location-info-mode").find("button").simulate("click");
    expect(push).toHaveBeenCalledWith("/app/designer/location");
  });
});

describe("<ZoomControls />", () => {
  const expectDisabledBtnCountToEqual = (expected: number) => {
    const wrapper = shallow(<ZoomControls
      zoom={jest.fn()}
      getConfigValue={jest.fn()} />);
    expect(wrapper.find(".disabled").length).toEqual(expected);
  };

  it("zoom buttons active", () => {
    mockAtMax = false;
    mockAtMin = false;
    expectDisabledBtnCountToEqual(0);
  });

  it("zoom out button disabled", () => {
    mockAtMax = false;
    mockAtMin = true;
    expectDisabledBtnCountToEqual(1);
  });

  it("zoom in button disabled", () => {
    mockAtMax = true;
    mockAtMin = false;
    expectDisabledBtnCountToEqual(1);
  });
});

describe("<PointsSubMenu />", () => {
  it("shows historic points", () => {
    const wrapper = mount(<PointsSubMenu
      dispatch={jest.fn()}
      getConfigValue={() => true} />);
    const toggleBtn = wrapper.find("button");
    expect(toggleBtn.text()).toEqual("yes");
    toggleBtn.simulate("click");
    expect(setWebAppConfigValue).toHaveBeenCalledWith(
      BooleanSetting.show_historic_points, false);
  });
});

describe("<FarmbotSubMenu />", () => {
  it("shows farmbot settings", () => {
    const wrapper = mount(<FarmbotSubMenu
      dispatch={jest.fn()}
      getConfigValue={() => true} />);
    const toggleBtn = wrapper.find("button");
    expect(toggleBtn.text()).toEqual("yes");
    toggleBtn.simulate("click");
    expect(setWebAppConfigValue).toHaveBeenCalledWith(
      BooleanSetting.show_camera_view_area, false);
  });
});
