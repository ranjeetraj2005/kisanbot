import React from "react";
import { StepParams } from "../interfaces";
import { ToolTips } from "../../constants";
import { StepWrapper } from "../step_ui";
import { Col, Row } from "../../ui/index";
import { StepInputBox } from "../inputs/step_input_box";
import { LegalArgString } from "farmbot";
import { t } from "../../i18next_wrapper";

export const TileUnknown = (props: StepParams) =>
  <StepWrapper
    className={"unknown-step"}
    helpText={ToolTips.UNKNOWN_STEP}
    currentSequence={props.currentSequence}
    currentStep={props.currentStep}
    dispatch={props.dispatch}
    index={props.index}
    resources={props.resources}>
    <Row>
      <Col xs={12}>
        <p>{t(ToolTips.UNKNOWN_STEP)}</p>
        <code>{JSON.stringify(props.currentStep)}</code>
        {Object.keys(props.currentStep.args).sort().map(arg =>
          <div key={arg}>
            <label>{arg}</label>
            <StepInputBox field={arg as LegalArgString}
              dispatch={props.dispatch}
              step={props.currentStep}
              sequence={props.currentSequence}
              index={props.index}
              fieldOverride={true} />
          </div>)}
      </Col>
    </Row>
  </StepWrapper>;
