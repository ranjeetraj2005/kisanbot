const mockDevice = {
  togglePin: jest.fn((_) => Promise.resolve()),
  writePin: jest.fn((_) => Promise.resolve()),
};
jest.mock("../../../device", () => ({ getDevice: () => mockDevice }));

import React from "react";
import { mount, shallow } from "enzyme";
import {
  PeripheralList, AnalogSlider, AnalogSliderProps, calc8BitValue, PinIOMode,
} from "../peripheral_list";
import {
  TaggedPeripheral,
  SpecialStatus,
} from "farmbot";
import { Pins } from "farmbot/dist";
import { PeripheralListProps } from "../interfaces";
import { Slider } from "@blueprintjs/core";
import { PinMode } from "../../../sequences/step_tiles/pin_support";

describe("<PeripheralList />", () => {
  const fakeProps = (): PeripheralListProps => {
    const peripherals: TaggedPeripheral[] = [
      {
        uuid: "Peripheral.2.2",
        kind: "Peripheral",
        specialStatus: SpecialStatus.SAVED,
        body: {
          id: 2,
          pin: 13,
          label: "GPIO 13 - LED",
          mode: 0,
        }
      },
      {
        uuid: "Peripheral.1.1",
        kind: "Peripheral",
        specialStatus: SpecialStatus.SAVED,
        body: {
          id: 1,
          pin: 2,
          label: "GPIO 2",
          mode: 0,
        }
      },
    ];

    const pins: Pins = {
      13: {
        mode: 0,
        value: 1
      },
      2: {
        mode: 0,
        value: 0
      }
    };
    return {
      dispatch: jest.fn(),
      peripherals,
      pins,
      disabled: false,
      locked: false,
    };
  };

  it("renders a list of peripherals, in sorted order", function () {
    const wrapper = mount(<PeripheralList {...fakeProps()} />);
    const labels = wrapper.find("label");
    const buttons = wrapper.find("button");
    const pinNumbers = wrapper.find("p");
    const first = labels.first();
    expect(first.text()).toBeTruthy();
    expect(first.text()).toEqual("GPIO 2");
    expect(pinNumbers.first().text()).toEqual("2");
    expect(buttons.first().text()).toEqual("off");
    const last = labels.last();
    expect(last.text()).toBeTruthy();
    expect(last.text()).toEqual("GPIO 13 - LED");
    expect(pinNumbers.last().text()).toEqual("13");
    expect(buttons.last().text()).toEqual("on");
  });

  it("renders analog peripherals", () => {
    const p = fakeProps();
    p.peripherals[0].body.mode = 1;
    const wrapper = shallow(<PeripheralList {...p} />);
    expect(wrapper.find("AnalogSlider").length).toEqual(1);
  });

  it("toggles pins", () => {
    const wrapper = mount(<PeripheralList {...fakeProps()} />);
    const toggle = wrapper.find("ToggleButton");
    toggle.first().simulate("click");
    expect(mockDevice.togglePin).toHaveBeenCalledWith({ pin_number: 2 });
    toggle.last().simulate("click");
    expect(mockDevice.togglePin).toHaveBeenLastCalledWith({ pin_number: 13 });
    expect(mockDevice.togglePin).toHaveBeenCalledTimes(2);
  });

  it("pins toggles are disabled", () => {
    const p = fakeProps();
    p.disabled = true;
    const wrapper = mount(<PeripheralList {...p} />);
    const toggle = wrapper.find("ToggleButton");
    toggle.first().simulate("click");
    toggle.last().simulate("click");
    expect(mockDevice.togglePin).not.toHaveBeenCalled();
  });
});

describe("<AnalogSlider />", () => {
  const fakeProps = (): AnalogSliderProps => ({
    disabled: undefined,
    pin: undefined,
    initialValue: undefined,
  });

  it("changes value", () => {
    const wrapper = shallow<AnalogSlider>(<AnalogSlider {...fakeProps()} />);
    expect(wrapper.state().value).toEqual(0);
    wrapper.find(Slider).simulate("change", 128);
    expect(wrapper.state().value).toEqual(128);
  });

  it("sends value", () => {
    const p = fakeProps();
    p.pin = 13;
    const wrapper = shallow<AnalogSlider>(<AnalogSlider {...p} />);
    wrapper.find(Slider).simulate("release", 128);
    expect(mockDevice.writePin).toHaveBeenCalledWith({
      pin_number: 13, pin_value: 128, pin_mode: 1
    });
  });

  it("doesn't send value", () => {
    const wrapper = shallow<AnalogSlider>(<AnalogSlider {...fakeProps()} />);
    wrapper.find(Slider).simulate("release", 128);
    expect(mockDevice.writePin).not.toHaveBeenCalled();
  });

  it("renders read value", () => {
    const p = fakeProps();
    p.initialValue = 255;
    const wrapper = shallow(<AnalogSlider {...p} />);
    expect(wrapper.find(Slider).props().value).toEqual(255);
    wrapper.find(Slider).simulate("change", 128);
    expect(wrapper.find(Slider).props().value).toEqual(128);
  });
});

describe("calc8BitValue()", () => {
  it.each<[PinIOMode, number | undefined, PinMode, number]>([
    [PinIOMode.input, 1000, PinMode.analog, 249],
    [PinIOMode.input, 1, PinMode.digital, 255],
    [PinIOMode.input, undefined, PinMode.analog, 0],
    [PinIOMode.input, undefined, PinMode.digital, 0],
    [PinIOMode.output, 128, PinMode.analog, 128],
    [PinIOMode.output, 1, PinMode.digital, 255],
    [PinIOMode.output, undefined, PinMode.digital, 0],
    [PinIOMode.input_pullup, 1000, PinMode.analog, 6],
    [PinIOMode.input_pullup, 1, PinMode.digital, 0],
    [PinIOMode.input_pullup, undefined, PinMode.analog, 0],
    [PinIOMode.input_pullup, undefined, PinMode.digital, 0],
  ])("returns correct value in i/o mode %s for %s in mode %s",
    (ioMode, value, mode, expected) => {
      expect(calc8BitValue(ioMode, value, mode)).toEqual(expected);
    });
});
