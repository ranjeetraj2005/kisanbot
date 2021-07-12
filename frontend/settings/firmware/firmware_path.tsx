import React from "react";
import { t } from "../../i18next_wrapper";
import { FBSelect, DropDownItem, Row, Col } from "../../ui";
import { updateConfig } from "../../devices/actions";
import { Highlight } from "../maybe_highlight";
import { DeviceSetting } from "../../constants";

export interface ChangeFirmwarePathProps {
  dispatch: Function;
  firmwarePath: string;
}

export const ChangeFirmwarePath = (props: ChangeFirmwarePathProps) => {
  const OPTIONS: Record<string, DropDownItem> = {
    "": { label: t("Change firmware path to..."), value: "" },
    ttyACM0: { label: t("ttyACM0 (recommended for Genesis)"), value: "ttyACM0" },
    ttyAMA0: { label: t("ttyAMA0 (recommended for Express)"), value: "ttyAMA0" },
    ttyUSB0: { label: "ttyUSB0", value: "ttyUSB0" },
    manual: { label: t("Manual input"), value: "manual" },
  };
  const [selection, setSelection] = React.useState("");
  const [manualInput, setManualInput] = React.useState("");
  const submit = (value: string) =>
    value && props.dispatch(updateConfig({ firmware_path: value }));
  return <div className={"firmware-path-selection"}>
    <FBSelect
      key={selection + props.firmwarePath}
      selectedItem={OPTIONS[selection]}
      onChange={ddi => {
        ddi.value != "manual" && submit("" + ddi.value);
        setSelection(ddi.value == "manual" ? "manual" : "");
      }}
      list={Object.values(OPTIONS).filter(ddi => ddi.value)} />
    {selection == "manual" &&
      <div className={"manual-selection"}>
        <p>{t("Look for the 'Available UART devices' log message.")}</p>
        <Col xs={7}>
          <input type={"text"}
            value={manualInput}
            onChange={e => setManualInput(e.currentTarget.value)} />
        </Col>
        <Col xs={5}>
          <button
            className={"fb-button green"}
            onClick={() => {
              submit(manualInput);
              setManualInput("");
            }}
            title={t("submit")}
            disabled={!manualInput}>
            {t("submit")}
          </button>
        </Col>
      </div>}
  </div>;
};

export interface FirmwarePathRowProps {
  dispatch: Function;
  firmwarePath: string;
  showAdvanced: boolean;
}

export const FirmwarePathRow = (props: FirmwarePathRowProps) =>
  <Highlight settingName={DeviceSetting.firmwarePath}
    hidden={!props.showAdvanced}
    className={"advanced"}>
    <Row>
      <Col xs={6}>
        <label>
          {t("Firmware path")}
        </label>
      </Col>
      <Col xs={6}>
        <code>{props.firmwarePath || t("not set")}</code>
      </Col>
    </Row>
    <Row>
      <Col xs={12} className={"no-pad"}>
        <ChangeFirmwarePath
          dispatch={props.dispatch}
          firmwarePath={props.firmwarePath} />
      </Col>
    </Row>
  </Highlight>;
