jest.mock("../../../api/crud", () => ({ overwrite: jest.fn() }));

import React from "react";
import { mount } from "enzyme";
import { RegimenRows } from "../regimen_rows";
import { RegimenRowsProps } from "../interfaces";
import { fakeRegimen } from "../../../__test_support__/fake_state/resources";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import { overwrite } from "../../../api/crud";
import { VariableDeclaration } from "farmbot";

const testVariable: VariableDeclaration = {
  kind: "variable_declaration",
  args: {
    label: "variable", data_value: {
      kind: "coordinate", args: { x: 1, y: 2, z: 3 }
    }
  }
};

describe("<RegimenRows />", () => {
  const fakeProps = (): RegimenRowsProps => {
    const regimen = fakeRegimen();
    return {
      regimen: fakeRegimen(),
      calendar: [{
        day: "1",
        items: [{
          name: "Item 0",
          color: "red",
          hhmm: "10:00",
          sortKey: 0,
          day: 1,
          dispatch: jest.fn(),
          regimen: regimen,
          item: {
            sequence_id: 0, time_offset: 1000
          },
          variable: undefined,
        }]
      }],
      dispatch: jest.fn(),
      varsCollapsed: false,
      resources: buildResourceIndex([]).index,
    };
  };

  it("renders", () => {
    const wrapper = mount(<RegimenRows {...fakeProps()} />);
    ["Day", "Item 0", "10:00"].map(string =>
      expect(wrapper.text()).toContain(string));
  });

  it("removes regimen item", () => {
    const keptItem = { sequence_id: 1, time_offset: 1000 };
    const p = fakeProps();
    p.calendar[0].items[0].regimen.body.regimen_items =
      [p.calendar[0].items[0].item, keptItem];
    const wrapper = mount(<RegimenRows {...p} />);
    wrapper.find("i").last().simulate("click");
    expect(overwrite).toHaveBeenCalledWith(expect.any(Object),
      expect.objectContaining({ regimen_items: [keptItem] }));
  });

  it("shows location variable label: coordinate", () => {
    const p = fakeProps();
    p.calendar[0].items[0].regimen.body.body = [testVariable];
    p.calendar[0].items[0].variable = testVariable.args.label;
    const wrapper = mount(<RegimenRows {...p} />);
    expect(wrapper.find(".regimen-event-variable").text())
      .toEqual("Location Variable - Coordinate (1, 2, 3)");
  });

  it("doesn't show location variable label", () => {
    const p = fakeProps();
    p.calendar[0].items[0].regimen.body.body = [];
    p.calendar[0].items[0].variable = "variable";
    const wrapper = mount(<RegimenRows {...p} />);
    expect(wrapper.find(".regimen-event-variable").length).toEqual(0);
  });

  it("has correct height without variable form", () => {
    const p = fakeProps();
    p.regimen.body.body = [];
    const wrapper = mount(<RegimenRows {...p} />);
    expect(wrapper.find(".regimen").props().style).toEqual({
      height: "calc(100vh - 200px)"
    });
  });

  it("has correct height with variable form", () => {
    const p = fakeProps();
    p.regimen.body.body = [testVariable];
    const wrapper = mount(<RegimenRows {...p} />);
    expect(wrapper.find(".regimen").props().style)
      .toEqual({ height: "calc(100vh - 500px)" });
  });

  it("has correct height with variable form collapsed", () => {
    const p = fakeProps();
    p.regimen.body.body = [testVariable];
    p.varsCollapsed = true;
    const wrapper = mount(<RegimenRows {...p} />);
    expect(wrapper.find(".regimen").props().style)
      .toEqual({ height: "calc(100vh - 300px)" });
  });

  it("automatically calculates height", () => {
    document.getElementById = () => ({ offsetHeight: 101 } as HTMLElement);
    const wrapper = mount(<RegimenRows {...fakeProps()} />);
    expect(wrapper.find(".regimen").props().style)
      .toEqual({ height: "calc(100vh - 301px)" });
  });
});
