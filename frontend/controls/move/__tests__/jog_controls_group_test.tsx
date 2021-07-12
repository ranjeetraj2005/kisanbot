import React from "react";
import { mount } from "enzyme";
import { JogControlsGroup } from "../jog_controls_group";
import { JogControlsGroupProps } from "../interfaces";
import { clickButton } from "../../../__test_support__/helpers";
import { Actions } from "../../../constants";

describe("<JogControlsGroup />", () => {
  const fakeProps = (): JogControlsGroupProps => ({
    dispatch: jest.fn(),
    stepSize: 100,
    botPosition: { x: undefined, y: undefined, z: undefined },
    getConfigValue: jest.fn(),
    arduinoBusy: false,
    botOnline: true,
    firmwareSettings: {},
    env: {},
    locked: false,
  });

  it("changes step size", () => {
    const p = fakeProps();
    const wrapper = mount(<JogControlsGroup {...p} />);
    clickButton(wrapper, 0, "1");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.CHANGE_STEP_SIZE,
      payload: 1
    });
  });
});
