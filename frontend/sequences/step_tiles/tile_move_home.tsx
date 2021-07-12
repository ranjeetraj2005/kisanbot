import React from "react";
import { StepParams } from "../interfaces";
import { ToolTips } from "../../constants";
import { StepWrapper } from "../step_ui";
import { AxisStepRadio } from "../step_ui/step_radio";
import { StepInputBox } from "../inputs/step_input_box";
import { Row, Col } from "../../ui";
import { t } from "../../i18next_wrapper";
import { Home } from "farmbot";

export const TileMoveHome = (props: StepParams<Home>) =>
  <StepWrapper
    className={"move-home-step"}
    helpText={ToolTips.MOVE_TO_HOME}
    currentSequence={props.currentSequence}
    currentStep={props.currentStep}
    dispatch={props.dispatch}
    index={props.index}
    resources={props.resources}>
    <AxisStepRadio
      currentSequence={props.currentSequence}
      currentStep={props.currentStep}
      dispatch={props.dispatch}
      index={props.index}
      label={t("Home")} />
    <Row>
      <Col xs={12}>
        <label>{t("Speed")}</label>
        <StepInputBox field={"speed"}
          dispatch={props.dispatch}
          step={props.currentStep}
          sequence={props.currentSequence}
          index={props.index} />
      </Col>
    </Row>
  </StepWrapper>;
