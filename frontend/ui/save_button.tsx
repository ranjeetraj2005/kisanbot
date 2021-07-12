import React from "react";
import { SpecialStatus } from "farmbot";
import { t } from "../i18next_wrapper";

interface SaveBtnProps {
  /** Callback */
  onClick?: (e: React.MouseEvent<{}>) => void;
  status: SpecialStatus;
  dirtyText?: string;
  disabled?: boolean;
  /** Optional alternative to "SAVING" */
  savingText?: string;
  /** Optional alternative to "SAVED" */
  savedText?: string;
  /** Optional alternative color to green */
  color?: string;
  /** Optional boolean for whether the button should be hidden or shown */
  hidden?: boolean;
}

/** Animation during saving action */
const spinner = <span className="btn-spinner" />;

export function SaveBtn(props: SaveBtnProps) {
  const STATUS_TRANSLATION: Partial<Record<SpecialStatus, string>> = {
    [SpecialStatus.DIRTY]: "is-dirty",
    [SpecialStatus.SAVING]: "is-saving"
  };

  const CAPTIONS: Partial<Record<SpecialStatus, string>> = {
    [SpecialStatus.DIRTY]: (props.dirtyText || t("Save") + " *"),
    [SpecialStatus.SAVING]: props.savingText || t("Saving")
  };

  const { savedText, onClick, hidden, disabled } = props;
  const statusClass = STATUS_TRANSLATION[props.status || ""] || "is-saved";
  const klass = `${props.color || "green"} ${statusClass} save-btn fb-button`;
  const spinnerEl = (props.status === SpecialStatus.SAVING) ? spinner : "";

  return <button onClick={onClick} title={t("save")}
    disabled={disabled}
    hidden={!!hidden} className={klass}>
    {CAPTIONS[props.status] || (savedText || t("Saved") + " ✔")} {spinnerEl}
  </button>;
}
