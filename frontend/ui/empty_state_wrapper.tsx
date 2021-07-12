import React from "react";
import { t } from "../i18next_wrapper";
import { ErrorBoundary } from "../error_boundary";

export enum EmptyStateGraphic {
  plants = "plants",
  crops = "crops",
  no_crop_results = "no_crop_results",
  sequences = "sequences",
  regimens = "regimens",
  farm_events = "farm_events",
  groups = "groups",
  points = "points",
  tools = "tools",
  weeds = "weeds",
  zones = "zones",
}

interface EmptyStateWrapperProps {
  notEmpty: unknown;
  title?: string;
  text?: string;
  textElement?: JSX.Element;
  graphic: string;
  colorScheme?: "plants" | "events" | "gardens" | "points" | "tools"
  | "groups" | "weeds" | "zones" | "farmware" | "peripherals" | "sensors"
  | "location";
  children?: React.ReactNode;
}

export const EmptyStateWrapper = (props: EmptyStateWrapperProps) =>
  props.notEmpty
    ? <div className="non-empty-state">
      <ErrorBoundary>
        {props.children}
      </ErrorBoundary>
    </div>
    : <div className={`empty-state ${props.colorScheme || ""}`}>
      <img
        className="empty-state-graphic"
        src={`/app-resources/img/empty_state/${props.graphic}.png`} />
      {props.title &&
        <h5>{t(props.title)}</h5>}
      {props.textElement || <div className={"no-empty-state-text"} />}
      {props.text &&
        <p>{t(props.text)}</p>}
    </div>;
