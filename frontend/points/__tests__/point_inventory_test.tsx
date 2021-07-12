jest.mock("../../history", () => ({
  push: jest.fn(),
  getPathArray: () => [],
}));

jest.mock("../../api/delete_points", () => ({ deletePoints: jest.fn() }));

import React from "react";
import { mount, shallow } from "enzyme";
import {
  RawPoints as Points, PointsProps, mapStateToProps,
} from "../point_inventory";
import { fakePoint } from "../../__test_support__/fake_state/resources";
import { push } from "../../history";
import { fakeState } from "../../__test_support__/fake_state";
import {
  buildResourceIndex,
} from "../../__test_support__/resource_index_builder";
import { SearchField } from "../../ui/search_field";
import { PointSortMenu } from "../../farm_designer/sort_options";
import { deletePoints } from "../../api/delete_points";
import { Actions } from "../../constants";
import { tagAsSoilHeight } from "../soil_height";

describe("<Points />", () => {
  const fakeProps = (): PointsProps => ({
    genericPoints: [],
    dispatch: jest.fn(),
    hoveredPoint: undefined,
    gridIds: [],
    soilHeightLabels: false,
    sourceFbosConfig: () => ({ value: 0, consistent: true }),
  });

  it("renders no points", () => {
    const wrapper = mount(<Points {...fakeProps()} />);
    expect(wrapper.text()).toContain("No points yet.");
  });

  it("renders points", () => {
    const p = fakeProps();
    p.genericPoints = [fakePoint()];
    const wrapper = mount(<Points {...p} />);
    expect(wrapper.text()).toContain("Point 1");
  });

  it("navigates to point info", () => {
    const p = fakeProps();
    p.genericPoints = [fakePoint()];
    p.genericPoints[0].body.id = 1;
    const wrapper = mount(<Points {...p} />);
    wrapper.find(".point-search-item").first().simulate("click");
    expect(push).toHaveBeenCalledWith("/app/designer/points/1");
  });

  it("changes search term", () => {
    const p = fakeProps();
    p.genericPoints = [fakePoint(), fakePoint()];
    p.genericPoints[0].body.name = "point 0";
    p.genericPoints[1].body.name = "point 1";
    const wrapper = shallow<Points>(<Points {...p} />);
    wrapper.find(SearchField).simulate("change", "0");
    expect(wrapper.state().searchTerm).toEqual("0");
  });

  it("filters points", () => {
    const p = fakeProps();
    p.genericPoints = [fakePoint(), fakePoint()];
    p.genericPoints[0].body.name = "point 0";
    p.genericPoints[1].body.name = "point 1";
    const wrapper = mount(<Points {...p} />);
    wrapper.setState({ searchTerm: "0" });
    expect(wrapper.text()).not.toContain("point 1");
  });

  it("changes sort term", () => {
    const wrapper = shallow<Points>(<Points {...fakeProps()} />);
    const menu = wrapper.find(SearchField).props().customLeftIcon;
    const menuWrapper = shallow(<div>{menu}</div>);
    expect(wrapper.state().sortBy).toEqual(undefined);
    menuWrapper.find(PointSortMenu).simulate("change", {
      sortBy: "radius", reverse: true
    });
    expect(wrapper.state().sortBy).toEqual("radius");
    expect(wrapper.state().reverse).toEqual(true);
  });

  it("expands soil height section", () => {
    const p = fakeProps();
    const soilHeightPoint = fakePoint();
    soilHeightPoint.body.meta.color = "orange";
    tagAsSoilHeight(soilHeightPoint);
    p.genericPoints = [fakePoint(), soilHeightPoint];
    const wrapper = mount<Points>(<Points {...p} />);
    expect(wrapper.html()).not.toContain("soil-orange");
    expect(wrapper.text().toLowerCase()).toContain("soil height");
    expect(wrapper.state().soilHeight).toEqual(false);
    wrapper.find(".fa-caret-down").first().simulate("click");
    expect(wrapper.state().soilHeight).toEqual(true);
    expect(wrapper.html()).toContain("soil-orange");
  });

  it("expands soil height color section", () => {
    const p = fakeProps();
    const soilHeightPoint = fakePoint();
    soilHeightPoint.body.meta.color = "orange";
    soilHeightPoint.body.z = 90;
    tagAsSoilHeight(soilHeightPoint);
    const soilHeightPointRed = fakePoint();
    soilHeightPointRed.body.meta.color = "red";
    soilHeightPointRed.body.z = 100;
    tagAsSoilHeight(soilHeightPointRed);
    p.genericPoints = [fakePoint(), soilHeightPoint, soilHeightPointRed];
    const wrapper = mount<Points>(<Points {...p} />);
    expect(wrapper.html()).not.toContain("soil-orange");
    expect(wrapper.html()).not.toContain("soil-red");
    expect(wrapper.text().toLowerCase()).toContain("all soil height");
    expect(wrapper.state().soilHeightColors).toEqual([]);
    wrapper.find(".fa-caret-down").at(1).simulate("click");
    expect(wrapper.state().soilHeightColors).toEqual(["red"]);
    expect(wrapper.html()).not.toContain("soil-orange");
    expect(wrapper.html()).toContain("soil-red");
    wrapper.find(".fa-caret-up").first().simulate("click");
    expect(wrapper.state().soilHeightColors).toEqual([]);
  });

  it("expands grid points section", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    gridPoint.body.name = "mesh";
    p.genericPoints = [fakePoint(), gridPoint];
    const wrapper = mount<Points>(<Points {...p} />);
    expect(wrapper.text().toLowerCase()).toContain("mesh grid");
    expect(wrapper.state().gridIds).toEqual([]);
    wrapper.find(".fa-caret-down").last().simulate("click");
    expect(wrapper.state().gridIds).toEqual(["123"]);
    wrapper.find(".fa-caret-up").last().simulate("click");
    expect(wrapper.state().gridIds).toEqual([]);
  });

  it("doesn't delete all section points", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    p.genericPoints = [fakePoint(), gridPoint];
    window.confirm = () => false;
    const wrapper = mount<Points>(<Points {...p} />);
    wrapper.setState({ gridIds: ["123"] });
    wrapper.find(".delete").first().simulate("click");
    expect(deletePoints).not.toHaveBeenCalled();
  });

  it("deletes all section points", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    p.genericPoints = [fakePoint(), gridPoint];
    window.confirm = () => true;
    const wrapper = mount<Points>(<Points {...p} />);
    wrapper.setState({ gridIds: ["123"] });
    wrapper.find(".delete").first().simulate("click");
    expect(deletePoints).toHaveBeenCalledWith("points",
      { meta: { gridId: "123" } });
  });

  it("toggles grid point visibility", () => {
    const p = fakeProps();
    const gridPoint = fakePoint();
    gridPoint.body.meta.gridId = "123";
    p.genericPoints = [fakePoint(), gridPoint];
    const wrapper = mount<Points>(<Points {...p} />);
    wrapper.find(".fb-toggle-button").first().simulate("click");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.TOGGLE_GRID_ID, payload: "123"
    });
  });

  it("toggles height label visibility", () => {
    const p = fakeProps();
    const soilHeightPoint = fakePoint();
    tagAsSoilHeight(soilHeightPoint);
    p.genericPoints = [fakePoint(), soilHeightPoint];
    const wrapper = mount<Points>(<Points {...p} />);
    wrapper.setState({ soilHeight: true });
    wrapper.find(".fb-toggle-button").first().simulate("click");
    expect(p.dispatch).toHaveBeenCalledWith({
      type: Actions.TOGGLE_SOIL_HEIGHT_LABELS, payload: undefined
    });
  });
});

describe("mapStateToProps()", () => {
  it("returns props", () => {
    const state = fakeState();
    const point = fakePoint();
    const discarded = fakePoint();
    state.resources = buildResourceIndex([point, discarded]);
    const props = mapStateToProps(state);
    expect(props.genericPoints).toEqual([point, discarded]);
  });
});
