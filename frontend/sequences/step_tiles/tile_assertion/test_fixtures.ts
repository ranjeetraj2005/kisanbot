import { fakeSequence } from "../../../__test_support__/fake_state/resources";
import {
  buildResourceIndex,
} from "../../../__test_support__/resource_index_builder";
import { StepParams } from "../../interfaces";
import { Assertion } from "farmbot";

export const fakeAssertProps = (): StepParams<Assertion> => {
  const currentSequence = fakeSequence();
  currentSequence.body.id = 1;
  return {
    currentSequence,
    currentStep: {
      kind: "assertion",
      args: {
        lua: "return 2 + 2 == 4",
        assertion_type: "recover",
        _then: { kind: "execute", args: { sequence_id: 1 } },
      }
    },
    dispatch: jest.fn(),
    index: 1,
    resources: buildResourceIndex([currentSequence]).index,
  };
};
