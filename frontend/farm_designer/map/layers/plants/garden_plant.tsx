import React from "react";
import { GardenPlantProps, GardenPlantState } from "../../interfaces";
import { DEFAULT_ICON, svgToUrl } from "../../../../open_farm/icons";
import { transformXY, scaleIcon } from "../../util";
import { DragHelpers } from "../../active_plant/drag_helpers";
import { Color } from "../../../../ui/index";
import { Actions } from "../../../../constants";
import { cachedCrop } from "../../../../open_farm/cached_crop";
import { clickMapPlant } from "../../actions";
import { Circle } from "./circle";
import { SpecialStatus } from "farmbot";

export class GardenPlant extends
  React.Component<GardenPlantProps, Partial<GardenPlantState>> {

  state: GardenPlantState = { icon: DEFAULT_ICON, hover: false };

  componentDidMount() {
    const OFS = this.props.plant.body.openfarm_slug;
    cachedCrop(OFS)
      .then(({ svg_icon }) => {
        this.setState({ icon: svgToUrl(svg_icon) });
      });
  }

  click = () => {
    this.props.dispatch(clickMapPlant(this.props.uuid, this.state.icon));
  };

  iconHover = (action: "start" | "end") => {
    const hovered = action === "start";
    this.props.dispatch({
      type: Actions.HOVER_PLANT_LIST_ITEM,
      payload: hovered ? this.props.uuid : undefined
    });
    this.setState({ hover: hovered });
  };

  get grayscale() {
    const { plant } = this.props;
    const unsaved = plant.specialStatus !== SpecialStatus.SAVED;
    const gridPlant = plant.kind == "Point" && plant.body.meta.gridId;
    const maybeGrayscale = (gridPlant && unsaved) ? "url(#grayscale)" : "";
    return maybeGrayscale;
  }

  render() {
    const { current, selected, dragging, plant, mapTransformProps,
      activeDragXY, zoomLvl, animate, editing, hovered } = this.props;
    const { id, radius, x, y } = plant.body;
    const { icon, hover } = this.state;
    const plantIconSize = scaleIcon(radius);
    const iconRadius = hover ? plantIconSize * 1.1 : plantIconSize;
    const { qx, qy } = transformXY(x, y, mapTransformProps);
    const alpha = dragging ? 0.4 : 1.0;
    const className = [
      "plant-image",
      `is-chosen-${current || selected}`,
      animate ? "animate" : "",
    ].join(" ");

    return <g id={"plant-" + id}>
      <filter id="grayscale">
        <feColorMatrix type="saturate" values="0" />
      </filter>

      {animate &&
        <circle
          className="soil-cloud"
          cx={qx}
          cy={qy}
          r={plantIconSize}
          fill={Color.soilCloud}
          fillOpacity={0} />}

      {(current || selected) && !editing && !hovered &&
        <g id="selected-plant-indicator">
          <Circle
            className={`plant-indicator ${animate ? "animate" : ""}`}
            x={qx}
            y={qy}
            r={plantIconSize}
            selected={true} />
        </g>}

      <g id="plant-icon">
        <image
          onMouseEnter={() => this.iconHover("start")}
          onMouseLeave={() => this.iconHover("end")}
          visibility={dragging ? "hidden" : "visible"}
          className={className}
          opacity={alpha}
          filter={this.grayscale}
          xlinkHref={icon}
          onClick={this.click}
          height={iconRadius * 2}
          width={iconRadius * 2}
          x={qx - iconRadius}
          y={qy - iconRadius} />
      </g>

      <DragHelpers // for inactive plants
        dragging={dragging}
        plant={plant}
        mapTransformProps={mapTransformProps}
        zoomLvl={zoomLvl}
        activeDragXY={activeDragXY}
        plantAreaOffset={{ x: 0, y: 0 }} />
    </g>;
  }
}
