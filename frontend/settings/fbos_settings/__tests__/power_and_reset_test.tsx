const mockDevice = { rebootFirmware: jest.fn(() => Promise.resolve()) };
jest.mock("../../../device", () => ({ getDevice: () => mockDevice }));

import React from "react";
import { PowerAndReset } from "../power_and_reset";
import { mount } from "enzyme";
import { PowerAndResetProps } from "../interfaces";
import { panelState } from "../../../__test_support__/control_panel_state";
import { fakeState } from "../../../__test_support__/fake_state";
import { fakeFbosConfig } from "../../../__test_support__/fake_state/resources";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";

describe("<PowerAndReset/>", () => {
  const fakeConfig = fakeFbosConfig();
  const state = fakeState();
  state.resources = buildResourceIndex([fakeConfig]);

  const fakeProps = (): PowerAndResetProps => ({
    controlPanelState: panelState(),
    dispatch: jest.fn(x => x(jest.fn(), () => state)),
    botOnline: true,
  });

  it("renders in open state", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = true;
    const wrapper = mount(<PowerAndReset {...p} />);
    ["Power and Reset", "Restart", "Shutdown", "Soft Reset", "Hard Reset"]
      .map(string => expect(wrapper.text().toLowerCase())
        .toContain(string.toLowerCase()));
  });

  it("renders as closed", () => {
    const p = fakeProps();
    p.controlPanelState.power_and_reset = false;
    const wrapper = mount(<PowerAndReset {...p} />);
    expect(wrapper.text().toLowerCase())
      .toContain("Power and Reset".toLowerCase());
    expect(wrapper.text().toLowerCase())
      .not.toContain("Soft Reset".toLowerCase());
  });
});
