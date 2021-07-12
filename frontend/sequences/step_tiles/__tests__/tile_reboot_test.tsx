jest.mock("../../../api/crud", () => ({ editStep: jest.fn() }));

let mockDev = false;
jest.mock("../../../settings/dev/dev_support", () => ({
  DevSettings: { futureFeaturesEnabled: () => mockDev },
}));

import React from "react";
import { render } from "enzyme";
import { TileReboot, editTheRebootStep, rebootExecutor } from "../tile_reboot";
import { StepParams } from "../../interfaces";
import { fakeSequence } from "../../../__test_support__/fake_state/resources";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import { editStep } from "../../../api/crud";
import { Reboot } from "farmbot";
import { Content } from "../../../constants";

describe("<TileReboot />", () => {
  const fakeProps = (): StepParams<Reboot> => ({
    currentSequence: fakeSequence(),
    currentStep: {
      kind: "reboot",
      args: {
        package: "farmbot_os"
      }
    },
    dispatch: jest.fn(),
    index: 1,
    resources: buildResourceIndex().index,
  });

  it("renders", () => {
    const block = render(<TileReboot {...fakeProps()} />);
    expect(block.text()).toContain(Content.REBOOT_STEP);
    expect(block.text().toLowerCase()).not.toContain("arduino");
  });

  it("renders package selector", () => {
    mockDev = true;
    const block = render(<TileReboot {...fakeProps()} />);
    expect(block.text().toLowerCase()).toContain("arduino");
  });

  it("edits the reboot step", () => {
    const p = fakeProps();
    const editFn = editTheRebootStep(p);
    editFn("arduino_firmware");
    expect(p.dispatch).toHaveBeenCalled();
    expect(editStep).toHaveBeenCalledWith({
      step: p.currentStep,
      index: p.index,
      sequence: p.currentSequence,
      executor: expect.any(Function),
    });
  });

  it("executes the executor", () => {
    const p = fakeProps();
    const step = p.currentStep;
    step.args.package = "X";
    const fn = rebootExecutor("arduino_firmware");
    fn(step);
    expect(step.args.package).toBe("arduino_firmware");
  });
});
