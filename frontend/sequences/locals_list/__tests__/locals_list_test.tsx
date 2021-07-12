import React from "react";
import { localListCallback, LocalsList } from "../locals_list";
import {
  ParameterApplication, Coordinate, ParameterDeclaration, VariableDeclaration,
} from "farmbot";
import {
  fakeSequence,
} from "../../../__test_support__/fake_state/resources";
import { shallow } from "enzyme";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import { LocalsListProps, AllowedVariableNodes } from "../locals_list_support";
import { VariableNameSet } from "../../../resources/interfaces";
import { LocationForm } from "../location_form";

describe("<LocalsList/>", () => {
  const coordinate: Coordinate = {
    kind: "coordinate",
    args: { x: 1, y: 2, z: 3 }
  };
  const mrGoodVar: ParameterApplication = {
    // https://en.wikipedia.org/wiki/Mr._Goodbar
    kind: "parameter_application",
    args: { label: "parent", data_value: coordinate }
  };
  const variableData: VariableNameSet = {
    parent: {
      celeryNode: mrGoodVar,
      dropdown: { value: "parent", label: "parent" },
      vector: coordinate.args,
    }
  };

  const fakeProps = (): LocalsListProps => {
    const sequence = fakeSequence();
    return {
      variableData: undefined,
      sequenceUuid: sequence.uuid,
      resources: buildResourceIndex([sequence]).index,
      onChange: jest.fn(),
      allowedVariableNodes: AllowedVariableNodes.parameter,
    };
  };

  it("doesn't have any variables to render", () => {
    const wrapper = shallow(<LocalsList {...fakeProps()} />);
    expect(wrapper.find(LocationForm).length).toBe(0);
  });

  it("shows all variables", () => {
    const p = fakeProps();
    p.variableData = variableData;
    const wrapper = shallow(<LocalsList {...p} />);
    expect(wrapper.find(LocationForm).length).toBe(1);
  });

  it("hides already assigned variables", () => {
    const p = fakeProps();
    p.allowedVariableNodes = AllowedVariableNodes.identifier;
    p.bodyVariables = [];
    p.variableData = variableData;
    const wrapper = shallow(<LocalsList {...p} />);
    expect(wrapper.find(LocationForm).length).toBe(0);
  });
});

describe("localListCallback()", () => {
  it("handles a new local declaration", () => {
    const sequence = fakeSequence();
    const dispatch = jest.fn();
    const cb = localListCallback({ sequence, dispatch });
    const parameterDeclaration: ParameterDeclaration = {
      kind: "parameter_declaration",
      args: {
        label: "parent", default_value: {
          kind: "coordinate", args: { x: 1, y: 2, z: 3 }
        }
      }
    };
    const variableDeclaration: VariableDeclaration = {
      kind: "variable_declaration",
      args: {
        label: "foo",
        data_value: { kind: "coordinate", args: { x: 0, y: 0, z: 0 } }
      }
    };
    cb([parameterDeclaration, variableDeclaration])({
      kind: "variable_declaration",
      args: {
        label: "foo",
        data_value: { kind: "coordinate", args: { x: 1, y: 2, z: 3 } }
      }
    });
    const action = expect.objectContaining({ type: "OVERWRITE_RESOURCE" });
    expect(dispatch)
      .toHaveBeenCalledWith(action);
    expect(dispatch)
      .toHaveBeenCalledWith(expect.objectContaining({
        payload: expect.objectContaining({ uuid: sequence.uuid })
      }));
  });
});
