import { Everything } from "../interfaces";
import { getWebAppConfigValue } from "../config_storage/actions";
import { validFwConfig, validFbosConfig } from "../util";
import { getFirmwareConfig, getFbosConfig } from "../resources/getters";
import {
  sourceFwConfigValue, sourceFbosConfigValue,
} from "./source_config_value";
import {
  getDeviceAccountSettings, maybeGetTimeSettings, getUserAccountSettings,
  selectAllFarmwareEnvs,
  selectAllWizardStepResults,
} from "../resources/selectors";
import {
  saveOrEditFarmwareEnv, getShouldDisplayFn,
} from "../farmware/state_to_props";
import { getAllAlerts } from "../messages/state_to_props";
import { DesignerSettingsProps } from "./interfaces";

export const mapStateToProps = (props: Everything): DesignerSettingsProps => ({
  dispatch: props.dispatch,
  getConfigValue: getWebAppConfigValue(() => props),
  firmwareConfig: validFwConfig(getFirmwareConfig(props.resources.index)),
  sourceFwConfig: sourceFwConfigValue(validFwConfig(getFirmwareConfig(
    props.resources.index)), props.bot.hardware.mcu_params),
  sourceFbosConfig: sourceFbosConfigValue(validFbosConfig(getFbosConfig(
    props.resources.index)), props.bot.hardware.configuration),
  resources: props.resources.index,
  deviceAccount: getDeviceAccountSettings(props.resources.index),
  shouldDisplay: getShouldDisplayFn(props.resources.index, props.bot),
  saveFarmwareEnv: saveOrEditFarmwareEnv(props.resources.index),
  timeSettings: maybeGetTimeSettings(props.resources.index),
  alerts: getAllAlerts(props.resources),
  bot: props.bot,
  searchTerm: props.resources.consumers.farm_designer.settingsSearchTerm,
  user: getUserAccountSettings(props.resources.index),
  farmwareEnvs: selectAllFarmwareEnvs(props.resources.index),
  wizardStepResults: selectAllWizardStepResults(props.resources.index),
  controlPanelState: props.app.controlPanelState,
});
