import * as React from "react";
import { TaggedWeedPointer } from "farmbot";
import { Actions } from "../constants";
import { push } from "../history";
import { t } from "../i18next_wrapper";
import { DEFAULT_WEED_ICON } from "../farm_designer/map/layers/weeds/garden_weed";
import { svgToUrl } from "../open_farm/icons";
import { genericWeedIcon } from "../point_groups/point_group_item";
import { getMode } from "../farm_designer/map/util";
import { Mode } from "../farm_designer/map/interfaces";
import { mapPointClickAction, selectPoint } from "../farm_designer/map/actions";
import { round } from "lodash";
import { edit, save, destroy } from "../api/crud";

export interface WeedInventoryItemProps {
  tpp: TaggedWeedPointer;
  dispatch: Function;
  hovered: boolean;
  pending?: boolean;
  maxSize?: number;
}

export class WeedInventoryItem extends
  React.Component<WeedInventoryItemProps, {}> {

  render() {
    const weed = this.props.tpp.body;
    const { tpp, dispatch } = this.props;
    const weedId = (weed.id || "ERR_NO_POINT_ID").toString();
    const scale = this.props.maxSize
      ? round(Math.max(0.5, weed.radius / this.props.maxSize), 2)
      : 1;

    const toggle = (action: "enter" | "leave") => {
      const isEnter = action === "enter";
      dispatch({
        type: Actions.TOGGLE_HOVERED_POINT,
        payload: isEnter ? tpp.uuid : undefined
      });
    };

    const click = () => {
      if (getMode() == Mode.boxSelect) {
        mapPointClickAction(dispatch, tpp.uuid)();
        toggle("leave");
      } else {
        push(`/app/designer/weeds/${weedId}`);
        dispatch({ type: Actions.TOGGLE_HOVERED_POINT, payload: [tpp.uuid] });
        dispatch(selectPoint([tpp.uuid]));
      }
    };

    return <div
      className={`weed-search-item ${this.props.hovered ? "hovered" : ""}`}
      key={weedId}
      onMouseEnter={() => toggle("enter")}
      onMouseLeave={() => toggle("leave")}
      onClick={click}>
      <span className={"weed-item-icon"}
        style={{ transform: `scale(${scale})` }}>
        <img className={"weed-icon"}
          src={DEFAULT_WEED_ICON}
          width={32}
          height={32} />
        <img
          src={svgToUrl(genericWeedIcon(weed.meta.color))}
          width={32}
          height={32} />
      </span>
      <span className="weed-search-item-name">
        {weed.name || t("Untitled weed")}
      </span>
      {this.props.pending &&
        <button className={"fb-button green"} onClick={e => {
          e.stopPropagation();
          this.props.dispatch(edit(tpp, { plant_stage: "active" }));
          this.props.dispatch(save(tpp.uuid));
        }}>
          <i className={"fa fa-check"} />
        </button>}
      {this.props.pending &&
        <button className={"fb-button red"} onClick={e => {
          e.stopPropagation();
          this.props.dispatch(destroy(tpp.uuid, true));
        }}>
          <i className={"fa fa-times"} />
        </button>}
      <p className="weed-search-item-info">
        <i>{`(${round(weed.x)}, ${round(weed.y)}) r${round(weed.radius)}`}</i>
      </p>
    </div>;
  }
}
