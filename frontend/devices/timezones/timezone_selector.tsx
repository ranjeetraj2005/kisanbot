import React from "react";
import { FBSelect, DropDownItem } from "../../ui";
import { list } from "./tz_list";
import { inferTimezone } from "./guess_timezone";
import { isString } from "lodash";
import { getModifiedClassNameDefaultFalse } from "../../settings/default_values";

const CHOICES: DropDownItem[] = list.map(x => ({ label: x, value: x }));

interface TZSelectorProps {
  currentTimezone: string | undefined;
  onUpdate(ts: string): void;
}

export class TimezoneSelector extends React.Component<TZSelectorProps, {}> {
  componentDidMount() {
    const tz = inferTimezone(this.props.currentTimezone);
    if (!this.props.currentTimezone) {
      // Nasty hack to prepopulate data of users who have yet to set a TZ.
      this.props.onUpdate(tz);
    }
  }

  selectedItem = (): DropDownItem => {
    const tz = inferTimezone(this.props.currentTimezone);
    return { label: tz, value: tz };
  }

  itemSelected = (d: DropDownItem): void => {
    if (isString(d.value)) {
      this.props.onUpdate(d.value);
    }
  }

  render() {
    return <FBSelect
      extraClass={getModifiedClassNameDefaultFalse(this.props.currentTimezone)}
      list={CHOICES}
      selectedItem={this.selectedItem()}
      onChange={this.itemSelected} />;
  }
}
