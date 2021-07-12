import React from "react";
import { connect } from "react-redux";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelHeader,
} from "../../farm_designer/designer_panel";
import { Panel } from "../../farm_designer/panel_header";
import { mapStateToProps } from "./state_to_props";
import { RegimenEditorProps } from "./interfaces";
import { t } from "../../i18next_wrapper";
import {
  setActiveRegimenByName,
} from "../set_active_regimen_by_name";
import { EmptyStateWrapper, EmptyStateGraphic } from "../../ui";
import { isTaggedRegimen } from "../../resources/tagged_resources";
import { Content } from "../../constants";
import { ActiveEditor } from "./active_editor";

export class RawDesignerRegimenEditor
  extends React.Component<RegimenEditorProps> {

  componentDidMount() {
    if (!this.props.current) { setActiveRegimenByName(); }
  }

  render() {
    const panelName = "designer-regimen-editor";
    const regimen = this.props.current;
    return <DesignerPanel panelName={panelName} panel={Panel.Regimens}>
      <DesignerPanelHeader
        panelName={panelName}
        panel={Panel.Regimens}
        title={this.props.current?.body.name || t("No Regimen selected")}
        backTo={"/app/designer/regimens"} />
      <DesignerPanelContent panelName={panelName}>
        <EmptyStateWrapper
          notEmpty={regimen && isTaggedRegimen(regimen) && this.props.calendar}
          graphic={EmptyStateGraphic.regimens}
          title={t("No Regimen selected.")}
          text={Content.NO_REGIMEN_SELECTED}>
          {regimen && <ActiveEditor
            dispatch={this.props.dispatch}
            regimen={regimen}
            calendar={this.props.calendar}
            resources={this.props.resources}
            variableData={this.props.variableData} />}
        </EmptyStateWrapper>
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const DesignerRegimenEditor =
  connect(mapStateToProps)(RawDesignerRegimenEditor);
