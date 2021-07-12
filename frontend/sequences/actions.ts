import { SequenceBodyItem, TaggedSequence } from "farmbot";
import { SelectSequence } from "./interfaces";
import { edit, init, overwrite } from "../api/crud";
import { defensiveClone, urlFriendly } from "../util";
import { push } from "../history";
import { Actions } from "../constants";
import { setActiveSequenceByName } from "./set_active_sequence_by_name";
import { t } from "../i18next_wrapper";
import { isNumber } from "lodash";
import { sequencesUrlBase } from "../folders/component";

export function pushStep(step: SequenceBodyItem,
  dispatch: Function,
  sequence: TaggedSequence,
  index?: number | undefined) {
  const next = defensiveClone(sequence);
  next.body.body = next.body.body || [];
  next.body.body.splice(isNumber(index) ? index : Infinity, 0, defensiveClone(step));
  dispatch(overwrite(sequence, next.body));
}

export function editCurrentSequence(dispatch: Function, seq: TaggedSequence,
  update: Partial<typeof seq.body>) {
  dispatch(edit(seq, update));
}

let count = 1;

export const copySequence = (payload: TaggedSequence) =>
  (dispatch: Function) => {
    const copy = defensiveClone(payload);
    copy.body.id = undefined;
    copy.body.name = copy.body.name + t(" copy ") + (count++);
    dispatch(init(copy.kind, copy.body));
    push(sequencesUrlBase() + urlFriendly(copy.body.name));
    setActiveSequenceByName();
  };

export const pinSequenceToggle = (sequence: TaggedSequence) =>
  (dispatch: Function) => {
    const pinned = sequence.body.pinned;
    editCurrentSequence(dispatch, sequence, { pinned: !pinned });
  };

export function selectSequence(uuid: string): SelectSequence {
  return {
    type: Actions.SELECT_SEQUENCE,
    payload: uuid
  };
}

export const unselectSequence = () => {
  push(sequencesUrlBase());
  return { type: Actions.SELECT_SEQUENCE, payload: undefined };
};

export const closeCommandMenu = () => ({
  type: Actions.SET_SEQUENCE_STEP_POSITION,
  payload: undefined,
});
