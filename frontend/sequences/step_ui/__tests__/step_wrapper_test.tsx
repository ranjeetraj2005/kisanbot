import React from "react";
import { mount } from "enzyme";
import { StepWrapper, StepWrapperProps } from "../step_wrapper";
import {
  fakeSequence, fakeWebAppConfig,
} from "../../../__test_support__/fake_state/resources";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";

describe("<StepWrapper />", () => {
  const fakeProps = (): StepWrapperProps => ({
    className: "step-class",
    helpText: "help text",
    currentSequence: fakeSequence(),
    currentStep: { kind: "take_photo", args: {} },
    dispatch: jest.fn(),
    index: 0,
    children: "child",
    resources: buildResourceIndex([]).index,
  });

  it("renders", () => {
    const wrapper = mount(<StepWrapper {...fakeProps()} />);
    const step = wrapper.find("div").first();
    expect(step.hasClass("step-wrapper")).toBeTruthy();
    expect(step.hasClass("step-class")).toBeTruthy();
  });

  it("renders pinned sequence", () => {
    const p = fakeProps();
    const sequence = fakeSequence();
    sequence.body.id = 1;
    sequence.body.pinned = true;
    sequence.body.color = "red";
    p.currentStep = { kind: "execute", args: { sequence_id: 1 } };
    p.resources = buildResourceIndex([sequence]).index;
    const wrapper = mount(<StepWrapper {...p} />);
    const step = wrapper.find("div").first();
    expect(step.find(".step-content").hasClass("red")).toBeTruthy();
  });

  it("toggles celery script view", () => {
    const p = fakeProps();
    const config = fakeWebAppConfig();
    config.body.view_celery_script = true;
    p.resources = buildResourceIndex([config]).index;
    const wrapper = mount<StepWrapper>(<StepWrapper {...p} />);
    expect(wrapper.state().viewRaw).toEqual(undefined);
    expect(wrapper.text().toLowerCase()).toContain("args");
    wrapper.instance().toggleViewRaw?.();
    expect(wrapper.state().viewRaw).toEqual(false);
    expect(wrapper.text().toLowerCase()).not.toContain("args");
  });
});
