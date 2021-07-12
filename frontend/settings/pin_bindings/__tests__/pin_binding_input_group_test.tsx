const mockDevice = {
  registerGpio: jest.fn(() => Promise.resolve()),
  unregisterGpio: jest.fn(() => Promise.resolve()),
};
jest.mock("../../../device", () => ({ getDevice: () => mockDevice }));

jest.mock("../../../api/crud", () => ({ initSave: jest.fn() }));

import * as React from "react";
import { mount, shallow } from "enzyme";
import { validGpioPins } from "../list_and_label_support";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import { TaggedSequence } from "farmbot";
import {
  fakeSequence,
} from "../../../__test_support__/fake_state/resources";
import { initSave } from "../../../api/crud";
import { PinBindingInputGroupProps } from "../interfaces";
import {
  PinBindingInputGroup, PinNumberInputGroup, BindingTypeDropDown,
  ActionTargetDropDown, SequenceTargetDropDown,
} from "../pin_binding_input_group";
import {
  fakeResourceIndex,
} from "../../../sequences/locals_list/test_helpers";
import {
  PinBindingType, PinBindingSpecialAction,
} from "farmbot/dist/resources/api_resources";
import { error, warning } from "../../../toast/toast";

const AVAILABLE_PIN = 18;

describe("<PinBindingInputGroup/>", () => {
  function fakeProps(): PinBindingInputGroupProps {
    const fakeResources: TaggedSequence[] = [fakeSequence(), fakeSequence()];
    fakeResources[0].body.id = 1;
    fakeResources[0].body.name = "Sequence 1";
    fakeResources[1].body.id = 2;
    fakeResources[1].body.name = "Sequence 2";
    const resources = buildResourceIndex(fakeResources).index;
    return {
      pinBindings: [
        { pin_number: 4, sequence_id: 1 },
        { pin_number: 5, sequence_id: 2 },
      ],
      dispatch: jest.fn(),
      resources: resources,
    };
  }

  it("renders", () => {
    const wrapper = mount(<PinBindingInputGroup {...fakeProps()} />);
    const buttons = wrapper.find("button");
    expect(buttons.length).toBe(4);
  });

  it("no pin selected", () => {
    const wrapper = mount(<PinBindingInputGroup {...fakeProps()} />);
    const buttons = wrapper.find("button");
    expect(buttons.last().props().title).toEqual("BIND");
    buttons.last().simulate("click");
    expect(error).toHaveBeenCalledWith("Pin number cannot be blank.");
  });

  it("no target selected", () => {
    const wrapper = mount(<PinBindingInputGroup {...fakeProps()} />);
    const buttons = wrapper.find("button");
    expect(buttons.last().props().title).toEqual("BIND");
    wrapper.setState({ pinNumberInput: AVAILABLE_PIN });
    buttons.last().simulate("click");
    expect(error).toHaveBeenCalledWith("Please select a sequence or action.");
  });

  it("registers pin: api", () => {
    const p = fakeProps();
    p.dispatch = jest.fn();
    const wrapper = mount(<PinBindingInputGroup {...p} />);
    const buttons = wrapper.find("button");
    expect(buttons.last().props().title).toEqual("BIND");
    wrapper.setState({ pinNumberInput: 1, sequenceIdInput: 2 });
    buttons.last().simulate("click");
    expect(mockDevice.registerGpio).not.toHaveBeenCalled();
    expect(initSave).toHaveBeenCalledWith("PinBinding",
      {
        pin_num: 1,
        sequence_id: 2,
        binding_type: PinBindingType.standard
      });
  });

  it("registers pin: api (special action)", () => {
    const p = fakeProps();
    p.dispatch = jest.fn();
    const wrapper = mount(<PinBindingInputGroup {...p} />);
    const buttons = wrapper.find("button");
    expect(buttons.last().props().title).toEqual("BIND");
    wrapper.setState({
      pinNumberInput: 0,
      bindingType: PinBindingType.special,
      sequenceIdInput: undefined,
      specialActionInput: PinBindingSpecialAction.emergency_lock
    });
    buttons.last().simulate("click");
    expect(mockDevice.registerGpio).not.toHaveBeenCalled();
    expect(initSave).toHaveBeenCalledWith("PinBinding",
      {
        pin_num: 0,
        binding_type: PinBindingType.special,
        special_action: PinBindingSpecialAction.emergency_lock
      });
  });

  it("sets sequence id", () => {
    const p = fakeProps();
    const key = Object.keys(p.resources.byKind.Sequence)[0];
    const s = p.resources.references[key];
    const id = s?.body.id;
    const wrapper = mount<PinBindingInputGroup>(<PinBindingInputGroup {...p} />);
    expect(wrapper.instance().state.sequenceIdInput).toEqual(undefined);
    wrapper.instance().setSequenceIdInput({ label: "label", value: "" + id });
    expect(wrapper.instance().state.sequenceIdInput).toEqual(id);
  });

  it("attempts to set pin 99", () => {
    const wrapper = shallow<PinBindingInputGroup>(
      <PinBindingInputGroup {...fakeProps()} />);
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
    wrapper.instance().setSelectedPin(99);
    expect(error).toHaveBeenCalledWith(
      "Invalid Raspberry Pi GPIO pin number.");
    expect(warning).not.toHaveBeenCalled();
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
  });

  it("attempts to set pin 1", () => {
    expect(validGpioPins.length).toBeGreaterThan(0);
    const wrapper = shallow<PinBindingInputGroup>(
      <PinBindingInputGroup {...fakeProps()} />);
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
    wrapper.instance().setSelectedPin(1);
    expect(error).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      "Reserved Raspberry Pi pin may not work as expected.");
    expect(wrapper.instance().state.pinNumberInput).toEqual(1);
  });

  it("rejects pin already in use", () => {
    const p = fakeProps();
    const wrapper = mount<PinBindingInputGroup>(<PinBindingInputGroup {...p} />);
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
    const { pin_number } = p.pinBindings[0];
    wrapper.instance().setSelectedPin(pin_number);
    expect(error).toHaveBeenCalledWith(
      "Raspberry Pi GPIO pin already bound or in use.");
    expect(warning).not.toHaveBeenCalled();
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
  });

  it("changes pin number to available pin", () => {
    expect(validGpioPins.length).toBeGreaterThan(0);
    const wrapper = shallow<PinBindingInputGroup>(<PinBindingInputGroup
      {...fakeProps()} />);
    expect(wrapper.instance().state.pinNumberInput).toEqual(undefined);
    wrapper.instance().setSelectedPin(AVAILABLE_PIN);
    expect(error).not.toHaveBeenCalled();
    expect(warning).not.toHaveBeenCalled();
    expect(wrapper.instance().state.pinNumberInput).toEqual(AVAILABLE_PIN);
  });

  it("changes binding type", () => {
    const wrapper = shallow<PinBindingInputGroup>(<PinBindingInputGroup
      {...fakeProps()} />);
    expect(wrapper.instance().state.bindingType).toEqual(PinBindingType.standard);
    wrapper.instance().setBindingType({ label: "", value: PinBindingType.special });
    expect(wrapper.instance().state.bindingType).toEqual(PinBindingType.special);
  });

  it("changes special action", () => {
    const wrapper = shallow<PinBindingInputGroup>(<PinBindingInputGroup
      {...fakeProps()} />);
    wrapper.setState({ bindingType: PinBindingType.special });
    expect(wrapper.instance().state.specialActionInput).toEqual(undefined);
    wrapper.instance().setSpecialAction({
      label: "",
      value: PinBindingSpecialAction.sync
    });
    expect(wrapper.instance().state.specialActionInput)
      .toEqual(PinBindingSpecialAction.sync);
  });
});

describe("<PinNumberInputGroup />", () => {
  it("sets pin", () => {
    const setSelectedPin = jest.fn();
    const wrapper = shallow(<PinNumberInputGroup
      pinNumberInput={undefined}
      boundPins={[]}
      setSelectedPin={setSelectedPin} />);
    wrapper.find("FBSelect").simulate("change", {
      label: "", value: AVAILABLE_PIN
    });
    expect(setSelectedPin).toHaveBeenCalledWith(AVAILABLE_PIN);
  });
});

describe("<BindingTypeDropDown />", () => {
  it("sets binding type", () => {
    const setBindingType = jest.fn();
    const wrapper = shallow(<BindingTypeDropDown
      bindingType={PinBindingType.standard}
      setBindingType={setBindingType} />);
    const ddi = { label: "", value: PinBindingType.special };
    wrapper.find("FBSelect").simulate("change", ddi);
    expect(setBindingType).toHaveBeenCalledWith(ddi);
  });
});

describe("<ActionTargetDropDown />", () => {
  it("sets action", () => {
    const setSpecialAction = jest.fn();
    const wrapper = shallow(<ActionTargetDropDown
      specialActionInput={undefined}
      setSpecialAction={setSpecialAction} />);
    const ddi = { label: "", value: PinBindingSpecialAction.sync };
    wrapper.find("FBSelect").simulate("change", ddi);
    expect(setSpecialAction).toHaveBeenCalledWith(ddi);
  });
});

describe("<SequenceTargetDropDown />", () => {
  it("sets sequence ID", () => {
    const setSequenceIdInput = jest.fn();
    const wrapper = shallow(<SequenceTargetDropDown
      sequenceIdInput={undefined}
      resources={fakeResourceIndex()}
      setSequenceIdInput={setSequenceIdInput} />);
    const ddi = { label: "", value: 1 };
    wrapper.find("SequenceSelectBox").simulate("change", ddi);
    expect(setSequenceIdInput).toHaveBeenCalledWith(ddi);
  });
});
