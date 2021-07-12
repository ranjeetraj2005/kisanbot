jest.mock("../../../api/crud", () => ({ initSave: jest.fn() }));

jest.mock("../../../history", () => ({ history: { push: jest.fn() } }));

import * as React from "react";
import { mount, shallow } from "enzyme";
import {
  RawDesignerFarmwareAdd as DesignerFarmwareAdd,
  DesignerFarmwareAddProps,
  mapStateToProps,
} from "../add";
import { initSave } from "../../../api/crud";
import { history } from "../../../history";
import { fakeState } from "../../../__test_support__/fake_state";
import { error } from "../../../toast/toast";

describe("<DesignerFarmwareAdd />", () => {
  const fakeProps = (): DesignerFarmwareAddProps => ({
    dispatch: jest.fn(() => Promise.resolve()),
  });

  it("renders add farmware panel", () => {
    const wrapper = mount(<DesignerFarmwareAdd {...fakeProps()} />);
    ["install new farmware", "manifest url"].map(string =>
      expect(wrapper.text().toLowerCase()).toContain(string));
  });

  it("updates url", () => {
    const wrapper = shallow<DesignerFarmwareAdd>(
      <DesignerFarmwareAdd {...fakeProps()} />);
    wrapper.find("input").simulate("change", {
      currentTarget: { value: "fake url" }
    });
    expect(wrapper.state().packageUrl).toEqual("fake url");
  });

  it("adds a new farmware", async () => {
    const wrapper = mount(<DesignerFarmwareAdd {...fakeProps()} />);
    wrapper.setState({ packageUrl: "fake url" });
    await wrapper.find("button").simulate("click");
    expect(initSave).toHaveBeenCalledWith("FarmwareInstallation", {
      url: "fake url"
    });
    expect(history.push).toHaveBeenCalledWith("/app/designer/farmware");
    expect(error).not.toHaveBeenCalled();
  });

  it("doesn't add a new farmware", () => {
    const wrapper = mount(<DesignerFarmwareAdd {...fakeProps()} />);
    wrapper.setState({ packageUrl: undefined });
    wrapper.find("button").simulate("click");
    expect(initSave).not.toHaveBeenCalled();
    expect(history.push).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith("Please enter a URL");
  });
});

describe("mapStateToProps()", () => {
  it("returns props", () => {
    expect(mapStateToProps(fakeState()).dispatch).toEqual(expect.any(Function));
  });
});
