import * as React from "react";
import { CopyButtonProps } from "./interfaces";
import { init } from "../../api/crud";
import { TaggedRegimen } from "farmbot";
import { defensiveClone, urlFriendly } from "../../util";
import { push } from "../../history";
import { setActiveRegimenByName } from "../set_active_regimen_by_name";
import { t } from "../../i18next_wrapper";

export const CopyButton = ({ dispatch, regimen }: CopyButtonProps) =>
  <button
    className="fb-button yellow"
    title={t("copy")}
    onClick={() => dispatch(copyRegimen(regimen))}>
    <i className={"fa fa-clone"} />
  </button>;

let count = 1;

export const copyRegimen = (payload: TaggedRegimen) =>
  (dispatch: Function) => {
    const copy = defensiveClone(payload);
    copy.body.id = undefined;
    copy.body.name = copy.body.name + t(" copy ") + (count++);
    dispatch(init(copy.kind, copy.body));
    push("/app/designer/regimens/" + urlFriendly(copy.body.name));
    setActiveRegimenByName();
  };
