import React from "react";
import { FBSelect, DropDownItem } from "../../../ui";
import { t } from "../../../i18next_wrapper";
import {
  LocationNode, LocSelection, LocationSelectionProps, AxisSelection,
} from "./interfaces";
import { ResourceIndex, UUID } from "../../../resources/interfaces";
import {
  findPointerByTypeAndId, findSlotByToolId, findToolById,
} from "../../../resources/selectors";
import {
  maybeFindVariable, SequenceMeta,
} from "../../../resources/sequence_meta";
import {
  formatPoint, locationFormList, formatTool, COORDINATE_DDI,
} from "../../locals_list/location_form_list";
import { Move, Xyz } from "farmbot";

export const LocationSelection = (props: LocationSelectionProps) =>
  <FBSelect
    key={JSON.stringify(props.sequence)}
    list={locationList(props.resources, props.sequenceUuid)}
    customNullLabel={t("Choose location")}
    onChange={ddi => props.onChange(prepareLocation(ddi))}
    selectedItem={getSelectedLocation(
      props.locationNode,
      props.locationSelection,
      props.resources,
      props.sequenceUuid,
    )} />;

const prepareLocation = (ddi: DropDownItem): {
  locationNode: LocationNode | undefined,
  locationSelection: LocSelection | undefined,
} => {
  switch (ddi.headingId) {
    case "Coordinate":
      return {
        locationNode: undefined,
        locationSelection: LocSelection.custom,
      };
    case "Offset":
      return {
        locationNode: undefined,
        locationSelection: LocSelection.offset,
      };
    case "Identifier":
      return {
        locationNode: { kind: "identifier", args: { label: "" + ddi.value } },
        locationSelection: LocSelection.identifier,
      };
    case "Plant":
    case "GenericPointer":
    case "Weed":
    case "ToolSlot":
      return {
        locationNode: {
          kind: "point",
          args: {
            pointer_id: parseInt("" + ddi.value),
            pointer_type: ddi.headingId,
          }
        },
        locationSelection: LocSelection.point,
      };
    case "Tool":
      return {
        locationNode: {
          kind: "tool",
          args: { tool_id: parseInt("" + ddi.value) }
        },
        locationSelection: LocSelection.tool,
      };
  }
  return {
    locationNode: undefined,
    locationSelection: undefined,
  };
};

const locationList =
  (resources: ResourceIndex, sequenceUuid: UUID): DropDownItem[] => {
    const varLabel = resourceVariableLabel(maybeFindVariable(
      "parent", resources, sequenceUuid));
    return locationFormList(resources, [
      { headingId: "Offset", label: t("Offset from current location"), value: "" },
      { headingId: "Identifier", label: varLabel, value: "parent" },
    ]);
  };

const getSelectedLocation = (
  locationNode: LocationNode | undefined,
  locationSelection: LocSelection | undefined,
  resources: ResourceIndex,
  sequenceUuid: UUID,
): DropDownItem | undefined => {
  switch (locationSelection) {
    case LocSelection.custom:
      return COORDINATE_DDI();
    case LocSelection.offset:
      return { label: t("Offset from current location"), value: "" };
  }
  if (!locationNode) { return; }
  switch (locationNode.kind) {
    case "point":
      const { pointer_type, pointer_id } = locationNode.args;
      return formatPoint(
        findPointerByTypeAndId(resources, pointer_type, pointer_id));
    case "tool":
      const { tool_id } = locationNode.args;
      const toolSlot = findSlotByToolId(resources, tool_id);
      return formatTool(findToolById(resources, tool_id), toolSlot);
    case "identifier":
      const variable =
        maybeFindVariable(locationNode.args.label, resources, sequenceUuid);
      return {
        label: resourceVariableLabel(variable),
        value: locationNode.args.label,
      };
  }
};

const resourceVariableLabel = (variable: SequenceMeta | undefined) =>
  `${t("Variable")} - ${variable?.dropdown.label || t("Add new")}`;

export const LOCATION_NODES = ["point", "tool", "identifier"];

export const getLocationState = (step: Move): {
  location: LocationNode | undefined,
  locationSelection: LocSelection | undefined,
} => {
  /** Last axis_overwrite where axis_operand is a point, tool, or identifier. */
  const overwrite = step.body?.reverse().find(x =>
    x.kind == "axis_overwrite"
    && LOCATION_NODES.includes(x.args.axis_operand.kind));
  if (overwrite?.kind == "axis_overwrite") {
    switch (overwrite.args.axis_operand.kind) {
      case "point":
        return {
          location: overwrite.args.axis_operand,
          locationSelection: LocSelection.point,
        };
      case "tool":
        return {
          location: overwrite.args.axis_operand,
          locationSelection: LocSelection.tool,
        };
      case "identifier":
        return {
          location: overwrite.args.axis_operand,
          locationSelection: LocSelection.identifier,
        };
    }
  }
  const otherOverwrites = step.body?.filter(x =>
    x.kind == "axis_overwrite"
    && !LOCATION_NODES.includes(x.args.axis_operand.kind)
    && !(x.args.axis_operand.kind == "special_value"
      && x.args.axis_operand.args.label == AxisSelection.disable)) || [];
  if (otherOverwrites.length > 0) {
    return { location: undefined, locationSelection: LocSelection.custom };
  }
  const offsets = step.body?.filter(x =>
    x.kind == "axis_addition" && x.args.axis_operand.kind != "random") || [];
  if (offsets.length > 0) {
    return { location: undefined, locationSelection: LocSelection.offset };
  }
  return { location: undefined, locationSelection: undefined };
};

export const setSelectionFromLocation = (
  locationSelection: string | undefined,
  selection: Record<Xyz, AxisSelection | undefined>,
) => {
  const adjustValue = (axis: Xyz) => {
    switch (locationSelection) {
      case LocSelection.custom:
        return AxisSelection.custom;
    }
    return selection[axis];
  };
  return {
    x: adjustValue("x"),
    y: adjustValue("y"),
    z: adjustValue("z"),
  };
};

export const setOverwriteFromLocation = (
  locationSelection: string | undefined,
  overwrite: Record<Xyz, number | string | undefined>,
) => {
  const adjustValue = (axis: Xyz) => {
    switch (locationSelection) {
      case LocSelection.custom:
        return overwrite[axis] ?? 0;
      case LocSelection.offset:
        return undefined;
      case LocSelection.point:
      case LocSelection.tool:
      case LocSelection.identifier:
        return overwrite[axis] == 0 ? undefined : overwrite[axis];
    }
    return overwrite[axis];
  };
  return {
    x: adjustValue("x"),
    y: adjustValue("y"),
    z: adjustValue("z"),
  };
};

export const setOffsetFromLocation = (
  locationSelection: string | undefined,
  offset: Record<Xyz, number | string | undefined>,
) => {
  const adjustValue = (axis: Xyz) => {
    switch (locationSelection) {
      case LocSelection.custom:
        return undefined;
      case LocSelection.offset:
        return offset[axis] ?? 0;
      case LocSelection.point:
      case LocSelection.tool:
      case LocSelection.identifier:
        return offset[axis] == 0 ? undefined : offset[axis];
    }
    return offset[axis];
  };
  return {
    x: adjustValue("x"),
    y: adjustValue("y"),
    z: adjustValue("z"),
  };
};
