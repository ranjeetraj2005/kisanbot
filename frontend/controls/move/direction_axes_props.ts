import { DirectionAxesProps } from "./interfaces";
import { McuParams } from "farmbot";
import { BooleanSetting } from "../../session_keys";

export const calcMicrostepsPerMm = (
  steps_per_mm: number | undefined,
  microsteps_per_step: number | undefined) =>
  // The firmware currently interprets steps_per_mm as microsteps_per_mm.
  (steps_per_mm || 1) * (1 || microsteps_per_step || 1);

const calcAxisLength = (
  nr_steps: number | undefined,
  steps_per_mm: number | undefined,
  microsteps_per_step: number | undefined) => {
  return (nr_steps || 0)
    / calcMicrostepsPerMm(steps_per_mm, microsteps_per_step);
};

export function calculateAxialLengths(props: { firmwareSettings: McuParams }) {
  const fwParams = props.firmwareSettings;
  return {
    x: calcAxisLength(
      fwParams.movement_axis_nr_steps_x,
      fwParams.movement_step_per_mm_x,
      fwParams.movement_microsteps_x),
    y: calcAxisLength(
      fwParams.movement_axis_nr_steps_y,
      fwParams.movement_step_per_mm_y,
      fwParams.movement_microsteps_y),
    z: calcAxisLength(
      fwParams.movement_axis_nr_steps_z,
      fwParams.movement_step_per_mm_z,
      fwParams.movement_microsteps_z),
  };
}

export function buildDirectionProps(props: DirectionAxesProps) {
  const { firmwareSettings, botPosition, getConfigValue } = props;
  const lengths = calculateAxialLengths(props);
  return {
    x: {
      isInverted: !!getConfigValue(BooleanSetting.x_axis_inverted),
      stopAtHome: !!firmwareSettings.movement_stop_at_home_x,
      stopAtMax: !!firmwareSettings.movement_stop_at_max_x,
      axisLength: lengths.x,
      negativeOnly: !!firmwareSettings.movement_home_up_x,
      position: botPosition.x
    },
    y: {
      isInverted: !!getConfigValue(BooleanSetting.y_axis_inverted),
      stopAtHome: !!firmwareSettings.movement_stop_at_home_y,
      stopAtMax: !!firmwareSettings.movement_stop_at_max_y,
      axisLength: lengths.y,
      negativeOnly: !!firmwareSettings.movement_home_up_y,
      position: botPosition.y
    },
    z: {
      isInverted: !!getConfigValue(BooleanSetting.z_axis_inverted),
      stopAtHome: !!firmwareSettings.movement_stop_at_home_z,
      stopAtMax: !!firmwareSettings.movement_stop_at_max_z,
      axisLength: lengths.z,
      negativeOnly: !!firmwareSettings.movement_home_up_z,
      position: botPosition.z
    },
  };
}
