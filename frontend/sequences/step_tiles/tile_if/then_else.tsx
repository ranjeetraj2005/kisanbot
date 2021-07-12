import React from "react";
import { ThenElseParams, seqDropDown, IfBlockDropDownHandler } from "./index";
import { Col, FBSelect } from "../../../ui";
import { LocalsList } from "../../locals_list/locals_list";
import { AllowedVariableNodes } from "../../locals_list/locals_list_support";
import { t } from "../../../i18next_wrapper";

export function ThenElse(props: ThenElseParams) {
  const {
    onChange, selectedItem, calledSequenceVariableData, assignVariable
  } = IfBlockDropDownHandler(props);
  const { body } = props.currentStep.args[props.thenElseKey];
  return <Col xs={12} lg={6}>
    <div className="execute-row">
      <label>{props.thenElseKey === "_then" ? t("Then Execute") : t("Else Execute")}
      </label>
    </div>
    <FBSelect
      key={JSON.stringify(props.currentSequence)}
      allowEmpty={true}
      list={seqDropDown(props.resources)}
      onChange={onChange}
      selectedItem={selectedItem()} />
    {!!calledSequenceVariableData &&
      <Col xs={12}>
        <LocalsList
          bodyVariables={body}
          variableData={calledSequenceVariableData}
          sequenceUuid={props.currentSequence.uuid}
          resources={props.resources}
          onChange={assignVariable(body || [])}
          locationDropdownKey={JSON.stringify(props.currentSequence)}
          allowedVariableNodes={AllowedVariableNodes.identifier} />
      </Col>}
  </Col>;
}
