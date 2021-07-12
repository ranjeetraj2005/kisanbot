import React from "react";
import { Row, Col } from "../ui";
import { Everything } from "../interfaces";
import { BotPosition } from "../devices/interfaces";
import { connect } from "react-redux";
import { moveAbsolute } from "../devices/actions";
import { history } from "../history";
import { AxisInputBox } from "../controls/axis_input_box";
import { isNumber } from "lodash";
import { Actions, Content } from "../constants";
import { validBotLocationData } from "../util/util";
import { unselectPlant } from "./map/actions";
import { AxisNumberProperty } from "./map/interfaces";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelHeader,
} from "./designer_panel";
import { t } from "../i18next_wrapper";
import { isBotOnlineFromState } from "../devices/must_be_online";
import { PanelColor } from "./panel_header";

export function mapStateToProps(props: Everything): MoveToProps {
  return {
    chosenLocation: props.resources.consumers.farm_designer.chosenLocation,
    currentBotLocation:
      validBotLocationData(props.bot.hardware.location_data).position,
    dispatch: props.dispatch,
    botOnline: isBotOnlineFromState(props.bot),
    locked: props.bot.hardware.informational_settings.locked,
  };
}

export interface MoveToFormProps {
  chosenLocation: BotPosition;
  currentBotLocation: BotPosition;
  botOnline: boolean;
  locked: boolean;
}

export interface MoveToProps extends MoveToFormProps {
  dispatch: Function;
}

interface MoveToFormState {
  z: number | undefined;
}

export class MoveToForm extends React.Component<MoveToFormProps, MoveToFormState> {
  state = { z: this.props.chosenLocation.z };

  get vector(): { x: number, y: number, z: number } {
    const { chosenLocation } = this.props;
    const newX = chosenLocation.x;
    const newY = chosenLocation.y;
    const { x, y, z } = this.props.currentBotLocation;
    const inputZ = this.state.z;
    return {
      x: isNumber(newX) ? newX : (x || 0),
      y: isNumber(newY) ? newY : (y || 0),
      z: isNumber(inputZ) ? inputZ : (z || 0),
    };
  }

  render() {
    const { x, y } = this.props.chosenLocation;
    const { botOnline, locked } = this.props;
    return <div className={"move-to-form"}>
      <Row>
        <Col xs={3}>
          <label>{t("X AXIS")}</label>
        </Col>
        <Col xs={3}>
          <label>{t("Y AXIS")}</label>
        </Col>
        <Col xs={3}>
          <label>{t("Z AXIS")}</label>
        </Col>
      </Row>
      <Row>
        <Col xs={3}>
          <input disabled name="x" value={isNumber(x) ? x : "---"} />
        </Col>
        <Col xs={3}>
          <input disabled name="y" value={isNumber(y) ? y : "---"} />
        </Col>
        <AxisInputBox
          onChange={(_, val: number) => this.setState({ z: val })}
          axis={"z"}
          value={this.state.z} />
        <Col xs={3}>
          <button
            onClick={() => moveAbsolute(this.vector)}
            className={["fb-button green",
              (botOnline && !locked) ? "" : "pseudo-disabled",
            ].join(" ")}
            title={botOnline
              ? t("Move to this coordinate")
              : t(Content.NOT_AVAILABLE_WHEN_OFFLINE)}>
            {t("GO")}
          </button>
        </Col>
      </Row>
    </div>;
  }
}

export class RawMoveTo extends React.Component<MoveToProps, {}> {

  componentDidMount() {
    unselectPlant(this.props.dispatch)();
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: Actions.CHOOSE_LOCATION,
      payload: { x: undefined, y: undefined, z: undefined }
    });
  }

  render() {
    return <DesignerPanel panelName={"move-to"} panelColor={PanelColor.gray}>
      <DesignerPanelHeader
        panelName={"move-to"}
        panelColor={PanelColor.gray}
        title={t("Move to location")}
        backTo={"/app/designer/plants"}
        description={Content.MOVE_MODE_DESCRIPTION} />
      <DesignerPanelContent panelName={"move-to"}>
        <MoveToForm
          chosenLocation={this.props.chosenLocation}
          currentBotLocation={this.props.currentBotLocation}
          locked={this.props.locked}
          botOnline={this.props.botOnline} />
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const MoveModeLink = () =>
  <div className="move-to-mode">
    <button
      className="fb-button gray"
      title={t("open move mode panel")}
      onClick={() => history.push("/app/designer/move_to")}>
      {t("move mode")}
    </button>
  </div>;

/** Mark a new bot target location on the map. */
export const chooseLocation = (props: {
  gardenCoords: AxisNumberProperty | undefined,
  dispatch: Function,
}) => {
  if (props.gardenCoords) {
    props.dispatch({
      type: Actions.CHOOSE_LOCATION,
      payload: { x: props.gardenCoords.x, y: props.gardenCoords.y, z: 0 }
    });
  }
};

export const MoveTo = connect(mapStateToProps)(RawMoveTo);
