import React from "react";
import {
  Popover, PopoverInteractionKind, PopoverPosition, Position,
} from "@blueprintjs/core";
import { t } from "../i18next_wrapper";

interface HelpProps {
  text: string;
  onHover?: boolean;
  position?: PopoverPosition;
  customIcon?: string;
  customClass?: string;
  links?: React.ReactElement[];
  title?: string;
}

export function Help(props: HelpProps) {
  return <Popover
    position={props.position || Position.TOP_RIGHT}
    interactionKind={props.onHover
      ? PopoverInteractionKind.HOVER
      : PopoverInteractionKind.CLICK}
    className={props.customClass}
    popoverClassName={"help"}>
    <i className={`fa fa-${props.customIcon || "question-circle"} help-icon`}
      title={props.title} />
    <div className={"help-text-content"}>
      {t(props.text)}
      {props.links}
    </div>
  </Popover>;
}
