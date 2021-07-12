let mockPath = "/app/designer/regimens";
jest.mock("../../../history", () => ({
  push: jest.fn(),
  getPathArray: () => mockPath.split("/"),
  history: { getCurrentLocation: () => ({ pathname: mockPath }) },
}));

jest.mock("../../actions", () => ({ selectRegimen: jest.fn() }));

import * as React from "react";
import { RegimenListItemProps } from "../../interfaces";
import { RegimenListItem } from "../regimen_list_item";
import { render, shallow, mount } from "enzyme";
import { fakeRegimen } from "../../../__test_support__/fake_state/resources";
import { SpecialStatus, Color } from "farmbot";
import { push } from "../../../history";
import { selectRegimen } from "../../actions";

describe("<RegimenListItem/>", () => {
  const fakeProps = (): RegimenListItemProps => ({
    regimen: fakeRegimen(),
    dispatch: jest.fn(),
    inUse: false
  });

  it("renders the base case", () => {
    const p = fakeProps();
    const wrapper = render(<RegimenListItem {...p} />);
    expect(wrapper.html()).toContain(p.regimen.body.name);
    expect(wrapper.html()).toContain(p.regimen.body.color);
  });

  it("shows unsaved data indicator", () => {
    const p = fakeProps();
    p.regimen.specialStatus = SpecialStatus.DIRTY;
    const wrapper = render(<RegimenListItem {...p} />);
    expect(wrapper.text()).toContain("Foo *");
  });

  it("shows in-use indicator", () => {
    const p = fakeProps();
    p.inUse = true;
    const wrapper = render(<RegimenListItem {...p} />);
    expect(wrapper.find(".in-use").length).toEqual(1);
  });

  it("doesn't show in-use indicator", () => {
    const p = fakeProps();
    const wrapper = render(<RegimenListItem {...p} />);
    expect(wrapper.find(".in-use").length).toEqual(0);
  });

  it("selects regimen", () => {
    const p = fakeProps();
    p.regimen.body.name = "foo";
    const wrapper = shallow(<RegimenListItem {...p} />);
    wrapper.simulate("click");
    expect(selectRegimen).toHaveBeenCalledWith(p.regimen.uuid);
    expect(push).toHaveBeenCalledWith("/app/designer/regimens/foo");
  });

  it("handles missing data", () => {
    const p = fakeProps();
    p.regimen.body.name = "";
    p.regimen.body.color = "" as Color;
    p.regimen.specialStatus = SpecialStatus.DIRTY;
    mockPath = "/app/designer/regimens";
    const wrapper = mount(<RegimenListItem {...p} />);
    expect(wrapper.text()).toEqual(" *");
    expect(wrapper.find(".saucer").hasClass("gray")).toBeTruthy();
  });

  it("doesn't open regimen", () => {
    const wrapper = shallow(<RegimenListItem {...fakeProps()} />);
    const e = { stopPropagation: jest.fn() };
    wrapper.find(".regimen-color").simulate("click", e);
    expect(e.stopPropagation).toHaveBeenCalled();
  });
});
