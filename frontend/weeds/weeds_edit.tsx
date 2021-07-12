import React from "react";
import { connect } from "react-redux";
import {
  DesignerPanel, DesignerPanelHeader, DesignerPanelContent,
} from "../farm_designer/designer_panel";
import { t } from "../i18next_wrapper";
import { push, getPathArray } from "../history";
import { Everything } from "../interfaces";
import { TaggedWeedPointer } from "farmbot";
import { maybeFindWeedPointerById } from "../resources/selectors";
import { Panel } from "../farm_designer/panel_header";
import {
  EditPointProperties, PointActions, updatePoint, AdditionalWeedProperties,
} from "../points/point_edit_actions";
import { Actions } from "../constants";
import { selectPoint } from "../farm_designer/map/actions";
import { isBotOnlineFromState } from "../devices/must_be_online";

export interface EditWeedProps {
  dispatch: Function;
  findPoint(id: number): TaggedWeedPointer | undefined;
  botOnline: boolean;
}

export const mapStateToProps = (props: Everything): EditWeedProps => ({
  dispatch: props.dispatch,
  findPoint: id => maybeFindWeedPointerById(props.resources.index, id),
  botOnline: isBotOnlineFromState(props.bot),
});

export class RawEditWeed extends React.Component<EditWeedProps, {}> {
  get stringyID() { return getPathArray()[4] || ""; }
  get point() {
    if (this.stringyID) {
      return this.props.findPoint(parseInt(this.stringyID));
    }
  }
  get panelName() { return "weed-info"; }

  render() {
    const weedsPath = "/app/designer/weeds";
    !this.point && getPathArray().join("/").startsWith(weedsPath)
      && push(weedsPath);
    return <DesignerPanel panelName={this.panelName} panel={Panel.Weeds}>
      <DesignerPanelHeader
        panelName={this.panelName}
        panel={Panel.Weeds}
        title={t("Edit weed")}
        backTo={weedsPath}
        onBack={() => {
          this.props.dispatch({
            type: Actions.TOGGLE_HOVERED_POINT, payload: undefined
          });
          this.props.dispatch(selectPoint(undefined));
        }} />
      <DesignerPanelContent panelName={this.panelName}>
        {this.point
          ? <div className={"weed-panel-content-wrapper"}>
            <EditPointProperties point={this.point}
              botOnline={this.props.botOnline}
              updatePoint={updatePoint(this.point, this.props.dispatch)} />
            <AdditionalWeedProperties point={this.point}
              updatePoint={updatePoint(this.point, this.props.dispatch)} />
            <PointActions uuid={this.point.uuid} dispatch={this.props.dispatch} />
          </div>
          : <span>{t("Redirecting")}...</span>}
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const EditWeed = connect(mapStateToProps)(RawEditWeed);
