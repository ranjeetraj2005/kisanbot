import React from "react";
import { shallow } from "enzyme";
import { BlurableInput, BIProps } from "../blurable_input";
import { error } from "../../toast/toast";
import { focusEvent, keyboardEvent } from "../../__test_support__/fake_html_events";

describe("<BlurableInput />", () => {
  const fakeProps = (): BIProps => {
    return {
      onCommit: jest.fn(),
      value: "",
    };
  };

  it("focuses", () => {
    const p = fakeProps();
    p.value = "1";
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.find("input").simulate("focus");
    expect(wrapper.instance().state.buffer).toEqual("1");
    expect(wrapper.instance().state.isEditing).toEqual(true);
  });

  it("out of bounds: under", () => {
    const p = fakeProps();
    p.type = "number";
    p.min = 0;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.setState({ buffer: "-100" });
    wrapper.find("input").simulate("submit");
    expect(wrapper.instance().state.buffer).toEqual("");
    expect(p.onCommit).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Value must be greater than or equal to 0.");
  });

  it("out of bounds: over", () => {
    const p = fakeProps();
    p.type = "number";
    p.max = 100;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.setState({ buffer: "101" });
    wrapper.find("input").simulate("submit");
    expect(wrapper.instance().state.buffer).toEqual("");
    expect(p.onCommit).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Value must be less than or equal to 100.");
  });

  it("checks for non-number input", () => {
    const p = fakeProps();
    p.type = "number";
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.find("input").simulate("change", { currentTarget: { value: "" } });
    expect(wrapper.instance().state.buffer).toEqual("");
    expect(wrapper.instance().state.error).toEqual("Please enter a number.");
    wrapper.find("input").simulate("submit");
    expect(p.onCommit).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("allows empty input", () => {
    const p = fakeProps();
    p.type = "number";
    p.allowEmpty = true;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.find("input").simulate("change", { currentTarget: { value: "" } });
    expect(wrapper.instance().state.buffer).toEqual("");
    expect(wrapper.instance().state.error).toEqual(undefined);
    wrapper.find("input").simulate("submit");
    expect(p.onCommit).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("parses number", () => {
    const p = fakeProps();
    p.type = "number";
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    const e = { currentTarget: { value: "-1.1e+2" } };
    wrapper.setState({ buffer: e.currentTarget.value });
    wrapper.find("input").simulate("change", e);
    expect(wrapper.instance().state.buffer).toEqual(e.currentTarget.value);
  });

  it("triggers keyUp", () => {
    const p = fakeProps();
    p.clearBtn = true;
    p.keyCallback = undefined;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.setState({ buffer: "1" });
    wrapper.instance().keyUp(keyboardEvent(""));
    expect(wrapper.state().buffer).toEqual("1");
  });

  it("clears input", () => {
    const p = fakeProps();
    p.clearBtn = true;
    p.keyCallback = undefined;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.setState({ buffer: "1" });
    wrapper.find(".fa-undo").simulate("click");
    expect(wrapper.state().buffer).toEqual("");
  });

  it("clears input with callback", () => {
    const p = fakeProps();
    p.clearBtn = true;
    p.keyCallback = jest.fn();
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    wrapper.setState({ buffer: "1" });
    wrapper.find(".fa-undo").simulate("click");
    expect(wrapper.state().buffer).toEqual("");
    expect(p.keyCallback).toHaveBeenCalled();
  });

  it("auto-selects", () => {
    const p = fakeProps();
    p.autoSelect = true;
    const wrapper = shallow<BlurableInput>(<BlurableInput {...p} />);
    const e = focusEvent("text");
    wrapper.instance().focus(e);
    expect(e.target.setSelectionRange).toHaveBeenCalledWith(0, 4);
  });
});
