import * as React from "react";
import { MapTransformProps } from "../../interfaces";
import { CameraCalibrationData } from "../../../interfaces";
import { TaggedImage } from "farmbot";
import { MapImage } from "./map_image";
import { reverse, cloneDeep, some } from "lodash";
import { equals } from "../../../../util";
import { BooleanSetting, StringSetting } from "../../../../session_keys";
import { GetWebAppConfigValue } from "../../../../config_storage/actions";
import {
  parseFilterSetting, IMAGE_LAYER_CONFIG_KEYS, imageInRange, imageIsHidden,
} from "../../../../photos/photo_filter_settings/util";

export interface ImageLayerProps {
  visible: boolean;
  images: TaggedImage[];
  mapTransformProps: MapTransformProps;
  cameraCalibrationData: CameraCalibrationData;
  getConfigValue: GetWebAppConfigValue;
  hiddenImages: number[];
  shownImages: number[];
  hideUnShownImages: boolean;
  alwaysHighlightImage: boolean;
  hoveredMapImage: number | undefined;
}

export class ImageLayer extends React.Component<ImageLayerProps> {

  shouldComponentUpdate(nextProps: ImageLayerProps) {
    const configsChanged = some(IMAGE_LAYER_CONFIG_KEYS.map(key =>
      this.props.getConfigValue(key) != nextProps.getConfigValue(key)));
    return !equals(this.props, nextProps) || configsChanged;
  }

  render() {
    const {
      visible, images, mapTransformProps, cameraCalibrationData,
      hiddenImages, shownImages, getConfigValue,
      hideUnShownImages, alwaysHighlightImage, hoveredMapImage,
    } = this.props;
    const cropImages = !!getConfigValue(BooleanSetting.crop_images);
    const getFilterValue = parseFilterSetting(getConfigValue);
    const imageFilterBegin = getFilterValue(StringSetting.photo_filter_begin);
    const imageFilterEnd = getFilterValue(StringSetting.photo_filter_end);
    const hoveredImage: TaggedImage | undefined =
      images.filter(img => img.body.id == hoveredMapImage
        || (alwaysHighlightImage && shownImages.includes(img.body.id || 0)))[0];
    const rangeOverride = alwaysHighlightImage || hideUnShownImages;
    return <g id="image-layer">
      {visible &&
        reverse(cloneDeep(images))
          .filter(img =>
            (rangeOverride && shownImages.includes(img.body.id || 0))
            || imageInRange(img, imageFilterBegin, imageFilterEnd))
          .filter(img => !imageIsHidden(
            hiddenImages, shownImages, hideUnShownImages, img.body.id))
          .map(img =>
            <MapImage
              image={img}
              key={"image_" + img.body.id}
              hoveredMapImage={hoveredMapImage}
              cropImage={cropImages}
              cameraCalibrationData={cameraCalibrationData}
              mapTransformProps={mapTransformProps} />)}
      {visible && hoveredImage &&
        <MapImage
          image={hoveredImage}
          hoveredMapImage={hoveredMapImage}
          highlighted={true}
          cropImage={cropImages}
          cameraCalibrationData={cameraCalibrationData}
          mapTransformProps={mapTransformProps} />}
    </g>;
  }
}
