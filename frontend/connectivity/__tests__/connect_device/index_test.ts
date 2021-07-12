jest.mock("../../index", () => ({
  dispatchNetworkUp: jest.fn(),
  dispatchNetworkDown: jest.fn()
}));

const mockDevice = { readStatus: jest.fn(() => Promise.resolve()) };
jest.mock("../../../device", () => ({ getDevice: () => mockDevice }));

let mockConfigValue = false;
jest.mock("../../../config_storage/actions", () => ({
  getWebAppConfigValue: () => () => mockConfigValue,
}));

import { HardwareState } from "../../../devices/interfaces";
import {
  incomingStatus,
  actOnChannelName,
  showLogOnScreen,
  TITLE,
  bothUp,
  initLog,
  readStatus,
  onOffline,
  changeLastClientConnected,
  onSent,
  onOnline,
  onMalformed,
  speakLogAloud,
  onPublicBroadcast,
  onReconnect,
} from "../../connect_device";
import { Actions, Content } from "../../../constants";
import { Log } from "farmbot/dist/resources/api_resources";
import { ALLOWED_CHANNEL_NAMES, ALLOWED_MESSAGE_TYPES, Farmbot } from "farmbot";
import { dispatchNetworkUp, dispatchNetworkDown } from "../../index";
import { getDevice } from "../../../device";
import { talk } from "browser-speech";
import { MessageType } from "../../../sequences/interfaces";
import { FbjsEventName } from "farmbot/dist/constants";
import {
  info, error, success, warning, fun, busy, removeToast,
} from "../../../toast/toast";
import { onLogs } from "../../log_handlers";
import { fakeState } from "../../../__test_support__/fake_state";
import { globalQueue } from "../../batch_queue";

const ANY_NUMBER = expect.any(Number);

describe("readStatus()", () => {
  it("forces a read_status request to FarmBot", () => {
    readStatus();
    expect(getDevice().readStatus).toHaveBeenCalled();
  });
});

describe("incomingStatus", () => {
  it("creates an action", () => {
    const stub = {} as HardwareState;
    const result = incomingStatus(stub);
    expect(result.type).toEqual(Actions.STATUS_UPDATE);
    expect(result.payload).toEqual(stub);
  });
});

function fakeLog(meta_type: ALLOWED_MESSAGE_TYPES,
  channels: ALLOWED_CHANNEL_NAMES[] = ["toast"]): Log {
  return {
    message: "toasty!",
    type: meta_type,
    channels,
    created_at: -1
  };
}

describe("actOnChannelName()", () => {
  it("skips irrelevant channels like `email`", () => {
    const callback = jest.fn();
    actOnChannelName(fakeLog(MessageType.success, ["email"]), "toast", callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("executes callback for `toast` type", () => {
    const callback = jest.fn();
    const fakeToast = fakeLog(MessageType.success, ["toast", "email"]);
    actOnChannelName(fakeToast, "toast", callback);
    expect(callback).toHaveBeenCalledWith(fakeToast);
  });
});

describe("showLogOnScreen", () => {

  function assertToastr(types: ALLOWED_MESSAGE_TYPES[], toastr: Function) {
    jest.resetAllMocks();
    types.map((x) => {
      const log = fakeLog(x, ["toast"]);
      showLogOnScreen(log);
      expect(toastr).toHaveBeenCalledWith(log.message, TITLE());
    });
  }

  it("routes `info` and all others to toastr.info()", () => {
    assertToastr([
      MessageType.info,
      ("FOO" as ALLOWED_MESSAGE_TYPES)], info);
  });

  it("routes `error` to toastr.error()", () => {
    assertToastr([MessageType.error], error);
  });

  it("routes `warn` to toastr.warning()", () => {
    assertToastr([MessageType.warn], warning);
  });

  it("routes `busy` to toastr.busy()", () => {
    assertToastr([MessageType.busy], busy);
  });

  it("routes `fun` to toastr.fun()", () => {
    assertToastr([MessageType.fun], fun);
  });

  it("routes `success` to toastr.success()", () => {
    assertToastr([MessageType.success], success);
  });

  it("routes `debug` to toastr.info()", () => {
    const log = fakeLog(MessageType.debug, ["toast"]);
    showLogOnScreen(log);
    expect(info).toHaveBeenCalledWith(log.message, {
      title: TITLE(), color: "gray",
    });
  });
});

describe("speakLogAloud", () => {
  const fakeSpeakLog = fakeLog(MessageType.info);
  fakeSpeakLog.message = "hello";

  it("doesn't call browser-speech", () => {
    mockConfigValue = false;
    const speak = speakLogAloud(jest.fn());
    speak(fakeSpeakLog);
    expect(talk).not.toHaveBeenCalled();
  });

  it("calls browser-speech", () => {
    mockConfigValue = true;
    const speak = speakLogAloud(jest.fn());
    Object.defineProperty(navigator, "language", {
      value: "en_us", configurable: true
    });
    speak(fakeSpeakLog);
    expect(talk).toHaveBeenCalledWith("hello", "en");
  });
});

describe("initLog", () => {
  it("creates a Redux action (new log)", () => {
    const log = fakeLog(MessageType.error);
    const action = initLog(log);
    expect(action.payload.kind).toBe("Log");
    // expect(action.payload.specialStatus).toBe(undefined);
    if (action.payload.kind === "Log") {
      expect(action.payload.body.message).toBe(log.message);
    }
  });
});

describe("bothUp()", () => {
  it("marks MQTT and API as up", () => {
    bothUp();
    expect(dispatchNetworkUp).toHaveBeenCalledWith("user.mqtt", ANY_NUMBER);
  });
});

describe("onOffline", () => {
  it("tells the app MQTT is down", () => {
    jest.resetAllMocks();
    onOffline();
    expect(dispatchNetworkDown).toHaveBeenCalledWith("user.mqtt", ANY_NUMBER);
    expect(error).toHaveBeenCalledWith(
      Content.MQTT_DISCONNECTED, { idPrefix: "offline" });
  });
});

describe("onOnline", () => {
  it("tells the app MQTT is up", () => {
    jest.resetAllMocks();
    onOnline();
    expect(dispatchNetworkUp).toHaveBeenCalledWith("user.mqtt", ANY_NUMBER);
    expect(removeToast).toHaveBeenCalledWith("offline");
  });
});

describe("onReconnect()", () => {
  it("sends reconnect toast", () => {
    onReconnect();
    expect(warning).toHaveBeenCalledWith(
      "Attempting to reconnect to the message broker",
      { title: "Offline", color: "yellow", idPrefix: "offline" });
  });
});

describe("changeLastClientConnected", () => {
  it("tells farmbot when the last browser session was opened", () => {
    const setUserEnv = jest.fn((_) => Promise.resolve({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeFarmbot = { setUserEnv: setUserEnv as any } as Farmbot;
    changeLastClientConnected(fakeFarmbot)();
    expect(setUserEnv).toHaveBeenCalledWith(expect.objectContaining({
      "LAST_CLIENT_CONNECTED": expect.any(String)
    }));
  });
});

describe("onSent", () => {
  it("marks MQTT as up", () => {
    jest.resetAllMocks();
    onSent({ connected: true })();
    expect(dispatchNetworkUp).toHaveBeenCalledWith("user.mqtt", ANY_NUMBER);
  });

  it("marks MQTT as down", () => {
    jest.resetAllMocks();
    onSent({ connected: false })();
    expect(dispatchNetworkDown)
      .toHaveBeenCalledWith("user.mqtt", ANY_NUMBER);
  });
});

describe("onMalformed()", () => {
  it("handles malformed messages", () => {
    onMalformed();
    expect(warning)
      .toHaveBeenCalledWith(Content.MALFORMED_MESSAGE_REC_UPGRADE);
    jest.resetAllMocks();
    onMalformed();
    expect(warning) // Only fire once.
      .not
      .toHaveBeenCalledWith(Content.MALFORMED_MESSAGE_REC_UPGRADE);
  });
});

describe("onPublicBroadcast", () => {
  const expectBroadcastLog = () =>
    expect(console.log).toHaveBeenCalledWith(
      FbjsEventName.publicBroadcast, expect.any(Object));

  describe("onLogs", () => {
    it("Calls `networkUp` when good logs come in", () => {
      const dispatch = jest.fn();
      const fn = onLogs(dispatch, fakeState);
      const log = fakeLog(MessageType.error, []);
      log.message = "bot xyz is offline";
      const taggedLog = fn(log);
      globalQueue.maybeWork();
      expect(taggedLog && taggedLog.kind).toEqual("Log");
    });
  });

  it("triggers when appropriate", () => {
    window.confirm = jest.fn(() => true);
    console.log = jest.fn();
    onPublicBroadcast({});
    expectBroadcastLog();
    expect(window.confirm).toHaveBeenCalledWith(Content.FORCE_REFRESH_CONFIRM);
    expect(location.assign).toHaveBeenCalled();
  });

  it("allows cancellation of refresh", () => {
    window.confirm = jest.fn(() => false);
    window.alert = jest.fn();
    console.log = jest.fn();
    onPublicBroadcast({});
    expectBroadcastLog();
    expect(window.alert).toHaveBeenCalledWith(
      Content.FORCE_REFRESH_CANCEL_WARNING);
    expect(location.assign).not.toHaveBeenCalled();
  });
});
