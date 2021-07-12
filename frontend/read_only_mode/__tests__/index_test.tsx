let mockReadonlyState = true;
jest.mock("../app_is_read_only", () => ({
  appIsReadonly: jest.fn(() => mockReadonlyState)
}));

import React from "react";
import { shallow } from "enzyme";
import { AxiosRequestConfig } from "axios";
import { ReadOnlyIcon, readOnlyInterceptor } from "../index";
import { warning } from "../../toast/toast";

describe("readOnlyInterceptor", () => {
  it("resolves the config when app is not read-only", async () => {
    const conf = {};
    await expect(readOnlyInterceptor(conf)).resolves.toEqual(conf);
    expect(warning).not.toHaveBeenCalled();
  });

  it("rejects non-GET HTTP requests when app is read-only", async () => {
    mockReadonlyState = true;
    const conf: AxiosRequestConfig = { method: "PUT" };
    await expect(readOnlyInterceptor(conf)).rejects.toEqual(conf);
    expect(warning)
      .toHaveBeenCalledWith("Refusing to modify data in read-only mode");
  });

  it("allows HTTP GET requests when app is read-only", async () => {
    mockReadonlyState = true;
    const conf: AxiosRequestConfig = { method: "GET" };
    await expect(readOnlyInterceptor(conf)).resolves.toEqual(conf);
    expect(warning).not.toHaveBeenCalled();
  });
});

describe("<ReadOnlyIcon />", () => {
  it("shows nothing when unlocked", () => {
    const result = shallow(<ReadOnlyIcon locked={false} />);
    expect(result.html())
      .toEqual("<div class=\"read-only-mode-disabled\"></div>");
  });

  it("hows the pencil icon when locked", () => {
    const result = shallow(<ReadOnlyIcon locked={true} />);
    expect(result.find(".fa-pencil").length).toBe(1);
    expect(result.find(".fa-ban").length).toBe(1);
  });
});
