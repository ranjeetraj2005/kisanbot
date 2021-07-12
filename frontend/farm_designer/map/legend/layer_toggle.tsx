import React from "react";
import { Popover, Position } from "@blueprintjs/core";
import { t } from "../../../i18next_wrapper";
import { DeviceSetting } from "../../../constants";
import { getModifiedClassName } from "../../../settings/default_values";
import { BooleanConfigKey } from "farmbot/dist/resources/configs/web_app";

export interface LayerToggleProps {
  settingName: BooleanConfigKey;
  label: DeviceSetting;
  value: boolean | undefined;
  onClick(): void;
  popover?: JSX.Element | undefined;
  submenuTitle?: string;
}

/** A flipper type switch for showing/hiding the layers of the garden map. */
export function LayerToggle(props: LayerToggleProps) {
  const { label, value, onClick, popover, submenuTitle } = props;
  const title = submenuTitle || t("more");
  const classNames = [
    "fb-button",
    "fb-toggle-button",
    value ? "green" : "red",
    getModifiedClassName(props.settingName),
  ].join(" ");
  return <fieldset>
    <label>
      <span>
        {t(label)}
        {popover &&
          <Popover
            targetClassName={"caret-menu-button"}
            position={Position.BOTTOM_RIGHT}
            className={"caret-menu-button"}>
            <i className="fa fa-caret-down" title={t(title)} />
            {popover}
          </Popover>}
      </span>
    </label>
    <button className={classNames} onClick={onClick}
      title={`${value ? t("hide") : t("show")} ${t(label.replace("?", ""))}`} />
  </fieldset>;
}
