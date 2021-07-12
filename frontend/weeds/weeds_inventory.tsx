import React from "react";
import { connect } from "react-redux";
import { Everything } from "../interfaces";
import { DesignerNavTabs, Panel } from "../farm_designer/panel_header";
import {
  EmptyStateWrapper, EmptyStateGraphic,
} from "../ui/empty_state_wrapper";
import { Content } from "../constants";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelTop,
} from "../farm_designer/designer_panel";
import { t } from "../i18next_wrapper";
import { TaggedWeedPointer } from "farmbot";
import { selectAllWeedPointers } from "../resources/selectors";
import { WeedInventoryItem } from "./weed_inventory_item";
import { SearchField } from "../ui/search_field";
import {
  SortOptions, PointSortMenu, orderedPoints,
} from "../farm_designer/sort_options";
import { ToggleButton } from "../ui/toggle_button";
import {
  setWebAppConfigValue, GetWebAppConfigValue, getWebAppConfigValue,
} from "../config_storage/actions";
import { BooleanSetting } from "../session_keys";
import { UUID } from "../resources/interfaces";
import { BooleanConfigKey } from "farmbot/dist/resources/configs/web_app";
import { destroy, edit, save } from "../api/crud";
import { Collapse } from "@blueprintjs/core";

export interface WeedsProps {
  weeds: TaggedWeedPointer[];
  dispatch: Function;
  hoveredPoint: string | undefined;
  getConfigValue: GetWebAppConfigValue;
}

interface WeedsState extends SortOptions {
  searchTerm: string;
  pending: boolean;
  active: boolean;
  removed: boolean;
}

export const mapStateToProps = (props: Everything): WeedsProps => ({
  weeds: selectAllWeedPointers(props.resources.index),
  dispatch: props.dispatch,
  hoveredPoint: props.resources.consumers.farm_designer.hoveredPoint,
  getConfigValue: getWebAppConfigValue(() => props),
});

export interface WeedsSectionProps {
  category: "pending" | "active" | "removed";
  sectionTitle: string;
  emptyStateText: string;
  open: boolean;
  hoveredPoint: UUID | undefined;
  clickOpen(): void;
  items: TaggedWeedPointer[];
  dispatch: Function;
  layerValue?: boolean;
  layerSetting?: BooleanConfigKey;
  layerDisabled?: boolean;
}

export const WeedsSection = (props: WeedsSectionProps) => {
  const { layerSetting } = props;
  const rawMaxSize = Math.max(...props.items.map(item => item.body.radius));
  const maxSize = isFinite(rawMaxSize) ? rawMaxSize : 0;
  return <div className={`${props.category}-weeds`}>
    <div className={`${props.category}-weeds-header`}>
      <label>{`${t(props.sectionTitle)} (${props.items.length})`}</label>
      {props.category == "pending" && props.items.length > 0 &&
        <div className={"approval-buttons"}>
          <button className={"fb-button green"} onClick={() =>
            props.items.map(weed => {
              props.dispatch(edit(weed, { plant_stage: "active" }));
              props.dispatch(save(weed.uuid));
            })}>
            <i className={"fa fa-check"} />{t("all")}
          </button>
          <button className={"fb-button red"} onClick={() =>
            props.items.map(weed => props.dispatch(destroy(weed.uuid, true)))}>
            <i className={"fa fa-times"} />{t("all")}
          </button>
        </div>}
      <i className={`fa fa-caret-${props.open ? "up" : "down"}`}
        onClick={props.clickOpen} />
      {layerSetting && <ToggleButton disabled={props.layerDisabled}
        toggleValue={props.layerValue}
        customText={{ textFalse: t("off"), textTrue: t("on") }}
        toggleAction={() => props.dispatch(setWebAppConfigValue(
          layerSetting, !props.layerValue))} />}
    </div>
    <Collapse isOpen={props.open}>
      {props.items.length == 0 &&
        <p className={"no-weeds"}>{t(props.emptyStateText)}</p>}
      {props.items.map(p => <WeedInventoryItem
        key={p.uuid}
        tpp={p}
        maxSize={maxSize}
        pending={props.category == "pending"}
        hovered={props.hoveredPoint === p.uuid}
        dispatch={props.dispatch} />)}
    </Collapse>
  </div>;
};

export class RawWeeds extends React.Component<WeedsProps, WeedsState> {
  state: WeedsState = {
    searchTerm: "", sortBy: "radius", reverse: true,
    pending: true, active: true, removed: true,
  };

  get weeds() {
    return orderedPoints(this.props.weeds, this.state).filter(p =>
      p.body.name.toLowerCase().includes(this.state.searchTerm.toLowerCase()));
  }

  toggleOpen = (category: keyof WeedsState) => () =>
    this.setState({ ...this.state, [category]: !this.state[category] });

  PendingWeeds = () => <WeedsSection
    category={"pending"}
    sectionTitle={t("Pending")}
    emptyStateText={t("No pending weeds.")}
    items={this.weeds.filter(p => p.body.plant_stage === "pending")}
    open={this.state.pending}
    hoveredPoint={this.props.hoveredPoint}
    clickOpen={this.toggleOpen("pending")}
    dispatch={this.props.dispatch} />

  ActiveWeeds = () => <WeedsSection
    category={"active"}
    sectionTitle={t("Active")}
    emptyStateText={t("No active weeds.")}
    items={this.weeds.filter(p =>
      !["removed", "pending"].includes(p.body.plant_stage))}
    open={this.state.active}
    hoveredPoint={this.props.hoveredPoint}
    clickOpen={this.toggleOpen("active")}
    layerSetting={BooleanSetting.show_weeds}
    layerValue={!!this.props.getConfigValue(BooleanSetting.show_weeds)}
    dispatch={this.props.dispatch} />

  RemovedWeeds = () => <WeedsSection
    category={"removed"}
    sectionTitle={t("Removed")}
    emptyStateText={t("No removed weeds.")}
    items={this.weeds.filter(p => p.body.plant_stage === "removed")}
    open={this.state.removed}
    hoveredPoint={this.props.hoveredPoint}
    clickOpen={this.toggleOpen("removed")}
    layerSetting={BooleanSetting.show_historic_points}
    layerValue={!!this.props.getConfigValue(BooleanSetting.show_historic_points)}
    layerDisabled={!this.props.getConfigValue(BooleanSetting.show_weeds)}
    dispatch={this.props.dispatch} />

  render() {
    return <DesignerPanel panelName={"weeds-inventory"} panel={Panel.Weeds}>
      <DesignerNavTabs />
      <DesignerPanelTop
        panel={Panel.Weeds}
        linkTo={"/app/designer/weeds/add"}
        title={t("Add weed")}>
        <SearchField searchTerm={this.state.searchTerm}
          placeholder={t("Search your weeds...")}
          customLeftIcon={<PointSortMenu
            sortOptions={this.state} onChange={u => this.setState(u)} />}
          onChange={searchTerm => this.setState({ searchTerm })} />
      </DesignerPanelTop>
      <DesignerPanelContent panelName={"weeds-inventory"}>
        <EmptyStateWrapper
          notEmpty={this.props.weeds.length > 0}
          graphic={EmptyStateGraphic.weeds}
          title={t("No weeds yet.")}
          text={Content.NO_WEEDS}
          colorScheme={"weeds"}>
          <this.PendingWeeds />
          <this.ActiveWeeds />
          <this.RemovedWeeds />
        </EmptyStateWrapper>
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const Weeds = connect(mapStateToProps)(RawWeeds);
