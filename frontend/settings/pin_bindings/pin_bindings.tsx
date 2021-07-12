import * as React from "react";
import { PinBindingsProps } from "./interfaces";
import { Header } from "../hardware_settings/header";
import { Collapse } from "@blueprintjs/core";
import { PinBindingsContent } from "./pin_bindings_content";
import { DeviceSetting } from "../../constants";
import { Highlight } from "../maybe_highlight";

export function PinBindings(props: PinBindingsProps) {

  const { pin_bindings } = props.controlPanelState;
  const { dispatch, resources, firmwareHardware } = props;

  return <Highlight className={"section"}
    settingName={DeviceSetting.pinBindings}>
    <Header
      expanded={pin_bindings}
      title={DeviceSetting.pinBindings}
      panel={"pin_bindings"}
      dispatch={dispatch} />
    <Collapse isOpen={!!pin_bindings}>
      <PinBindingsContent dispatch={dispatch} resources={resources}
        firmwareHardware={firmwareHardware} />
    </Collapse>
  </Highlight>;
}
