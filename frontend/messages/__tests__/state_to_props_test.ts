import { fakeState } from "../../__test_support__/fake_state";
import { mapStateToProps, setupIncompleteAlert } from "../state_to_props";
import {
  buildResourceIndex, fakeDevice,
} from "../../__test_support__/resource_index_builder";
import {
  fakeAlert, fakeFbosConfig,
} from "../../__test_support__/fake_state/resources";

describe("mapStateToProps()", () => {
  it("shows API alerts", () => {
    const state = fakeState();
    const alert = fakeAlert();
    alert.body.problem_tag = "api.seed_data.missing";
    state.resources = buildResourceIndex([alert]);
    const props = mapStateToProps(state);
    expect(props.alerts).toEqual([alert.body, setupIncompleteAlert]);
  });

  it("doesn't show setup alert", () => {
    const state = fakeState();
    const alert = fakeAlert();
    alert.body.problem_tag = "api.seed_data.missing";
    const device = fakeDevice();
    device.body.setup_completed_at = "123";
    state.resources = buildResourceIndex([alert, device]);
    const props = mapStateToProps(state);
    expect(props.alerts).toEqual([alert.body]);
  });

  it("returns firmware value", () => {
    const state = fakeState();
    const fbosConfig = fakeFbosConfig();
    fbosConfig.body.firmware_hardware = "arduino";
    state.resources = buildResourceIndex([fbosConfig]);
    const props = mapStateToProps(state);
    expect(props.apiFirmwareValue).toEqual("arduino");
  });

  it("finds alert", () => {
    const state = fakeState();
    const alert = fakeAlert();
    alert.body.id = 1;
    state.resources = buildResourceIndex([alert]);
    const props = mapStateToProps(state);
    expect(props.findApiAlertById(1)).toEqual(alert.uuid);
  });
});
