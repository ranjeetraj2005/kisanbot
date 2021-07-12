import * as React from "react";
import { connect } from "react-redux";
import { mapStateToProps, formatPlantInfo } from "./map_state_to_props";
import { PlantPanel } from "./plant_panel";
import { unselectPlant } from "../farm_designer/map/actions";
import { TaggedPlant } from "../farm_designer/map/interfaces";
import {
  DesignerPanel, DesignerPanelHeader, DesignerPanelContent,
} from "../farm_designer/designer_panel";
import { t } from "../i18next_wrapper";
import { EditPlantInfoProps, PlantOptions } from "../farm_designer/interfaces";
import { isString } from "lodash";
import { push, getPathArray } from "../history";
import { destroy, edit, save } from "../api/crud";
import { BooleanSetting } from "../session_keys";
import { Panel } from "../farm_designer/panel_header";

export class RawPlantInfo extends React.Component<EditPlantInfoProps, {}> {
  get templates() { return isString(this.props.openedSavedGarden); }
  get stringyID() { return getPathArray()[this.templates ? 5 : 4] || ""; }
  get plant() { return this.props.findPlant(this.stringyID); }
  get confirmDelete() {
    const confirmSetting = this.props.getConfigValue(
      BooleanSetting.confirm_plant_deletion);
    return confirmSetting ?? true;
  }

  destroy = (plantUUID: string) => {
    this.props.dispatch(destroy(plantUUID, !this.confirmDelete));
  }

  updatePlant = (plantUUID: string, update: PlantOptions) => {
    if (this.plant) {
      this.props.dispatch(edit(this.plant, update));
      this.props.dispatch(save(plantUUID));
    }
  }

  fallback = () => {
    const plantsPath = "/app/designer/plants";
    const currentPath = getPathArray().join("/");
    const templatePath = "/app/designer/gardens/templates";
    (currentPath.startsWith(plantsPath) || currentPath.startsWith(templatePath))
      && push(plantsPath);
    return <DesignerPanel panelName={"plant-info"} panel={Panel.Plants}>
      <DesignerPanelHeader
        panelName={"plant-info"}
        panel={Panel.Plants}
        title={`${t("Edit")}`}
        backTo={plantsPath}
        onBack={unselectPlant(this.props.dispatch)} />
      <DesignerPanelContent panelName={"plants"}>
        <span>{t("Redirecting")}...</span>
      </DesignerPanelContent>
    </DesignerPanel>;
  }

  default = (plant_info: TaggedPlant) => {
    const info = formatPlantInfo(plant_info);
    return <DesignerPanel panelName={"plant-info"} panel={Panel.Plants}>
      <DesignerPanelHeader
        panelName={"plant-info"}
        panel={Panel.Plants}
        title={`${t("Edit")} ${info.name}`}
        backTo={"/app/designer/plants"}
        onBack={unselectPlant(this.props.dispatch)} />
      <PlantPanel
        info={info}
        onDestroy={this.destroy}
        updatePlant={this.updatePlant}
        dispatch={this.props.dispatch}
        timeSettings={this.props.timeSettings}
        inSavedGarden={!!this.props.openedSavedGarden} />
    </DesignerPanel>;
  }

  render() {
    const plant_info = this.plant;
    return plant_info ? this.default(plant_info) : this.fallback();
  }
}

export const PlantInfo = connect(mapStateToProps)(RawPlantInfo);
