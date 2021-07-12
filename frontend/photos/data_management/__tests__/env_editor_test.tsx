jest.mock("../../../api/crud", () => ({
  initSave: jest.fn(),
  edit: jest.fn(),
  save: jest.fn(),
  destroy: jest.fn(),
}));

import React from "react";
import { act } from "react-dom/test-utils";
import { mount, shallow, ReactWrapper } from "enzyme";
import { EnvEditor } from "../env_editor";
import { EnvEditorProps } from "../interfaces";
import { destroy, edit, initSave, save } from "../../../api/crud";
import { fakeFarmwareEnv } from "../../../__test_support__/fake_state/resources";
import { error } from "../../../toast/toast";

describe("<EnvEditor />", () => {
  const fakeProps = (): EnvEditorProps => ({
    dispatch: jest.fn(),
    farmwareEnvs: [],
  });

  const inputChange = (
    wrapper: ReactWrapper,
    position: number,
    value: string,
    event: "onChange" | "onBlur" = "onChange",
  ) =>
    act(() => wrapper.find("input").at(position).props()[event]?.(
      { currentTarget: { value } } as unknown as React.FocusEvent));

  it("doesn't show warning", () => {
    const wrapper = mount(<EnvEditor {...fakeProps()} />);
    expect(wrapper.text().toLowerCase()).not.toContain("warning");
  });

  it("shows warning", () => {
    const wrapper = mount(<EnvEditor {...fakeProps()} />);
    wrapper.find("button").at(1).simulate("click");
    expect(wrapper.text().toLowerCase()).toContain("warning");
  });

  it("saves new env", () => {
    const wrapper = mount(<EnvEditor {...fakeProps()} />);
    inputChange(wrapper, 0, "key");
    inputChange(wrapper, 1, "value");
    wrapper.find("button").at(2).simulate("click");
    expect(initSave).toHaveBeenCalledWith("FarmwareEnv",
      { key: "key", value: "value" });
    expect(error).not.toHaveBeenCalled();
  });

  it("doesn't save blank key", () => {
    const wrapper = mount(<EnvEditor {...fakeProps()} />);
    wrapper.find("button").at(2).simulate("click");
    expect(initSave).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("Key cannot be blank.");
  });

  it("edits key", () => {
    const p = fakeProps();
    const farmwareEnv = fakeFarmwareEnv();
    p.farmwareEnvs = [farmwareEnv];
    const wrapper = shallow(<EnvEditor {...p} />);
    wrapper.find("input").at(2).simulate("change",
      { currentTarget: { value: "key" } });
    wrapper.find("input").at(2).simulate("blur");
    expect(edit).toHaveBeenCalledWith(farmwareEnv, { key: "key" });
    expect(save).toHaveBeenCalledWith(farmwareEnv.uuid);
  });

  it("edits value", () => {
    const p = fakeProps();
    const farmwareEnv = fakeFarmwareEnv();
    p.farmwareEnvs = [farmwareEnv];
    const wrapper = shallow(<EnvEditor {...p} />);
    wrapper.find("input").at(3).simulate("change",
      { currentTarget: { value: "value" } });
    wrapper.find("input").at(3).simulate("blur");
    expect(edit).toHaveBeenCalledWith(farmwareEnv, { value: "value" });
    expect(save).toHaveBeenCalledWith(farmwareEnv.uuid);
  });

  it("deletes env", () => {
    const p = fakeProps();
    const farmwareEnv = fakeFarmwareEnv();
    p.farmwareEnvs = [farmwareEnv];
    const wrapper = mount(<EnvEditor {...p} />);
    wrapper.find("button").last().simulate("click");
    expect(destroy).toHaveBeenCalledWith(farmwareEnv.uuid);
  });
});
