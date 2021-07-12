import { Everything } from "../interfaces";
import {
  selectAllTools, maybeFindToolById, maybeGetToolSlot, maybeFindToolSlotById,
  selectAllToolSlotPointers,
  getDeviceAccountSettings,
  selectAllSensors,
} from "../resources/selectors";
import { validBotLocationData } from "../util";
import { UUID } from "../resources/interfaces";
import {
  getFwHardwareValue,
} from "../settings/firmware/firmware_hardware_support";
import { getFbosConfig } from "../resources/getters";
import { getWebAppConfigValue } from "../config_storage/actions";
import { BooleanSetting, NumericSetting } from "../session_keys";
import { isBotOriginQuadrant } from "../farm_designer/interfaces";
import { isActive } from "./edit_tool";
import {
  AddEditToolSlotPropsBase, AddToolSlotProps, EditToolSlotProps, ToolsProps,
} from "./interfaces";
import { isBotOnlineFromState } from "../devices/must_be_online";

export const mapStateToProps = (props: Everything): ToolsProps => {
  const getWebAppConfig = getWebAppConfigValue(() => props);
  const xySwap = !!getWebAppConfig(BooleanSetting.xy_swap);
  const rawQuadrant = getWebAppConfig(NumericSetting.bot_origin_quadrant);
  const quadrant = isBotOriginQuadrant(rawQuadrant) ? rawQuadrant : 2;
  return {
    tools: selectAllTools(props.resources.index),
    toolSlots: selectAllToolSlotPointers(props.resources.index),
    dispatch: props.dispatch,
    findTool: (id: number) => maybeFindToolById(props.resources.index, id),
    device: getDeviceAccountSettings(props.resources.index),
    sensors: selectAllSensors(props.resources.index),
    bot: props.bot,
    hoveredToolSlot: props.resources.consumers.farm_designer.hoveredToolSlot,
    firmwareHardware: getFwHardwareValue(getFbosConfig(props.resources.index)),
    isActive: isActive(selectAllToolSlotPointers(props.resources.index)),
    toolTransformProps: { xySwap, quadrant },
  };
};

export const mapStateToPropsAddEditBase = (props: Everything):
  AddEditToolSlotPropsBase => {
  const getWebAppConfig = getWebAppConfigValue(() => props);
  const xySwap = !!getWebAppConfig(BooleanSetting.xy_swap);
  const rawQuadrant = getWebAppConfig(NumericSetting.bot_origin_quadrant);
  const quadrant = isBotOriginQuadrant(rawQuadrant) ? rawQuadrant : 2;
  return {
    tools: selectAllTools(props.resources.index),
    dispatch: props.dispatch,
    botPosition: validBotLocationData(props.bot.hardware.location_data).position,
    findTool: (id: number) => maybeFindToolById(props.resources.index, id),
    firmwareHardware: getFwHardwareValue(getFbosConfig(props.resources.index)),
    toolTransformProps: { xySwap, quadrant },
    isActive: isActive(selectAllToolSlotPointers(props.resources.index)),
    botOnline: isBotOnlineFromState(props.bot),
  };
};

export const mapStateToPropsAdd = (props: Everything): AddToolSlotProps => {
  const stateToProps = mapStateToPropsAddEditBase(props) as AddToolSlotProps;
  stateToProps.findToolSlot = (uuid: UUID | undefined) =>
    maybeGetToolSlot(props.resources.index, uuid);
  return stateToProps;
};

export const mapStateToPropsEdit = (props: Everything): EditToolSlotProps => {
  const stateToProps = mapStateToPropsAddEditBase(props) as EditToolSlotProps;
  stateToProps.findToolSlot = (id: string) =>
    maybeFindToolSlotById(props.resources.index, parseInt(id));
  return stateToProps;
};
