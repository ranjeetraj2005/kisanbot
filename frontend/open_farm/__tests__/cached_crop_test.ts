const mockIcon = "<svg>Wow</svg>";
const mockResponse: { promise: Promise<{}> } = {
  promise: Promise.resolve({
    data: {
      id: 0,
      data: {
        attributes: {
          svg_icon: "<svg>Wow</svg>",
          slug: "lettuce"
        }
      }
    }
  })
};

jest.mock("axios", () => ({
  get: jest.fn(() => mockResponse.promise)
}));

jest.unmock("../cached_crop");
import { cachedCrop, maybeGetCachedPlantIcon, promiseCache } from "../cached_crop";
import axios from "axios";
import { times } from "lodash";
import { imgEvent } from "../../__test_support__/fake_html_events";
import { svgToUrl } from "../icons";

describe("cachedIcon()", () => {
  it("does an HTTP request if the icon can't be found locally", async () => {
    times(10, () => cachedCrop("lettuce"));
    const item1 = await cachedCrop("lettuce");
    expect(item1.svg_icon).toContain(mockIcon);
    const item2 = await cachedCrop("lettuce");
    expect(item2.slug).toBe(item1.slug);
    expect(item2.svg_icon).toBe(item1.svg_icon);
    expect(item2.spread).toBe(undefined);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("handles unexpected responses from OpenFarm", async () => {
    const old = mockResponse.promise;
    mockResponse.promise = Promise.resolve({ data: {} });
    const radish = await cachedCrop("radish");
    expect(radish.spread).toBeUndefined();
    expect(radish.svg_icon).toBeUndefined();
    mockResponse.promise = old;
  });
});

describe("maybeGetCachedPlantIcon()", () => {
  beforeEach(() => {
    Object.keys(promiseCache).map(key => delete promiseCache[key]);
  });

  const expectedIcon = svgToUrl(mockIcon);

  it("sets src", async () => {
    const img = imgEvent().currentTarget;
    const cb = jest.fn();
    await maybeGetCachedPlantIcon("slug", img, cb);
    await expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(
      "slug"));
    expect(img.getAttribute).toHaveBeenCalledWith("src");
    expect(img.setAttribute).toHaveBeenCalledWith("src", expectedIcon);
    expect(cb).toHaveBeenCalledWith(expectedIcon);
  });

  it("doesn't set icon twice", async () => {
    const img = imgEvent().currentTarget;
    img.getAttribute = jest.fn(() => expectedIcon);
    const cb = jest.fn();
    await maybeGetCachedPlantIcon("slug", img, cb);
    await expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(
      "slug"));
    expect(img.getAttribute).toHaveBeenCalledWith("src");
    expect(img.setAttribute).not.toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(expectedIcon);
  });

  it("doesn't set icon when undefined", async () => {
    const img = imgEvent().currentTarget;
    img.getAttribute = jest.fn(() => expectedIcon);
    const cb = jest.fn();
    await maybeGetCachedPlantIcon("", img, cb);
    await expect(axios.get).not.toHaveBeenCalled();
    expect(img.getAttribute).not.toHaveBeenCalled();
    expect(img.setAttribute).not.toHaveBeenCalled();
    expect(cb).not.toHaveBeenCalled();
  });
});
