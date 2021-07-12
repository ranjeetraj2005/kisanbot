import { TaggedLog } from "farmbot";
import { GetWebAppConfigValue } from "../../../../config_storage/actions";
import { CameraCalibrationData } from "../../../interfaces";
import { MapTransformProps } from "../../interfaces";

export enum RenderedLog {
  imageCapture = "imageCapture",
  imageCalibrate = "imageCalibrate",
  imageDetect = "imageDetect",
  imageMeasure = "imageMeasure",
}

export enum AnimationClass {
  capture = "capture",
  scan = "scan",
}

export interface LogsLayerProps {
  visible: boolean;
  logs: TaggedLog[];
  mapTransformProps: MapTransformProps;
  cameraCalibrationData: CameraCalibrationData;
  getConfigValue: GetWebAppConfigValue;
  deviceTarget: string;
}

export interface LogVisualProps {
  log: TaggedLog;
  visual: RenderedLog;
  cameraCalibrationData: CameraCalibrationData;
  cropImage: boolean;
  animate: boolean;
  mapTransformProps: MapTransformProps;
  deviceTarget: string;
}
