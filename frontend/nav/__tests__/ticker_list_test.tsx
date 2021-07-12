const mockStorj: Dictionary<number | boolean> = {};

let mockDemo = false;
jest.mock("../../devices/must_be_online", () => ({
  forceOnline: () => mockDemo,
}));

import React from "react";
import { mount } from "enzyme";
import { TickerList } from "../ticker_list";
import { Dictionary } from "farmbot";
import { fakeLog } from "../../__test_support__/fake_state/resources";
import { TickerListProps } from "../interfaces";
import { MESSAGE_TYPES } from "../../sequences/interfaces";
import { fakeTimeSettings } from "../../__test_support__/fake_time_settings";

describe("<TickerList />", () => {
  beforeEach(() => { mockDemo = false; });

  const fakeTaggedLog = () => {
    const log = fakeLog();
    log.body.message = "Farmbot is up and Running!";
    log.body.created_at = 1501703421;
    return log;
  };

  const fakeProps = (): TickerListProps => {
    return {
      timeSettings: fakeTimeSettings(),
      logs: [fakeTaggedLog(), fakeTaggedLog()],
      tickerListOpen: false,
      toggle: jest.fn(),
      getConfigValue: x => mockStorj[x],
      botOnline: true,
    };
  };

  function expectLogOccurrences(text: string, expectedCount: number) {
    const count = (text.match(/Running/g) || []).length;
    expect(count).toEqual(expectedCount);
  }

  it("shows log message and datetime", () => {
    const wrapper = mount(<TickerList {...fakeProps()} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text()).toContain("Farmbot is up and Running!");
    expect(labels.at(1).text()).toEqual("Aug 2, 7:50pm");
    expectLogOccurrences(wrapper.text(), 1);
  });

  it("shows bot offline log message", () => {
    const p = fakeProps();
    p.botOnline = false;
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text()).toContain("FarmBot is offline");
  });

  it("shows demo account log message", () => {
    mockDemo = true;
    const p = fakeProps();
    p.botOnline = false;
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text()).toContain("Using a demo account");
  });

  it("shows empty log message", () => {
    const p = fakeProps();
    p.logs = [];
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text()).toContain("No logs yet.");
  });

  it("shows 'loading' log message", () => {
    const p = fakeProps();
    p.logs[0].body.message = "";
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text()).toContain("Loading");
  });

  it("opens ticker", () => {
    const p = fakeProps();
    p.tickerListOpen = true;
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(5);
    expect(labels.at(0).text()).toContain("Farmbot is up and Running!");
    expect(labels.at(1).text()).toEqual("Aug 2, 7:50pm");
    expect(labels.at(2).text()).toContain("Farmbot is up and Running!");
    expect(labels.at(1).text()).toEqual("Aug 2, 7:50pm");
    expect(labels.at(4).text()).toEqual("View all logs");
    expectLogOccurrences(wrapper.text(), 2);
  });

  it("opens ticker when offline", () => {
    const p = fakeProps();
    p.botOnline = false;
    p.tickerListOpen = true;
    const wrapper = mount(<TickerList {...p} />);
    expectLogOccurrences(wrapper.text(), 2);
  });

  it("all logs filtered out", () => {
    MESSAGE_TYPES.map(logType => mockStorj[logType + "_log"] = 0);
    const p = fakeProps();
    p.logs[0].body.verbosity = 1;
    const wrapper = mount(<TickerList {...p} />);
    const labels = wrapper.find("label");
    expect(labels.length).toEqual(2);
    expect(labels.at(0).text())
      .toContain("No logs to display. Visit Logs page to view filters.");
  });
});
