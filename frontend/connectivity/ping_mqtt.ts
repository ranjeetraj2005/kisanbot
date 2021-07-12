import { Farmbot, uuid } from "farmbot";
import {
  dispatchNetworkDown,
  dispatchNetworkUp,
  dispatchQosStart,
  pingOK,
  pingNO,
} from "./index";
import { isNumber } from "lodash";
import axios from "axios";
import { API } from "../api/index";
import { FarmBotInternalConfig } from "farmbot/dist/config";
import { now } from "../devices/connectivity/qos";

export const PING_INTERVAL = 2000;
/**
 * Time to wait in milliseconds after sending a ping to manually fail it
 * if bot.ping() doesn't resolve or reject. Setting this value lower than
 * bot.ping()'s 10 second default promise timeout will shortcut that timeout.
 * This value will also limit the network quality "worst ping" time.
 */
const PING_TIMEOUT = 5500;

export const LAST_IN: keyof FarmBotInternalConfig = "LAST_PING_IN";
export const LAST_OUT: keyof FarmBotInternalConfig = "LAST_PING_OUT";
type Direction = "in" | "out";

export function readPing(bot: Farmbot, direction: Direction): number | undefined {
  const val = bot.getConfig(direction === "out" ? LAST_OUT : LAST_IN);
  return isNumber(val) ? val : undefined;
}

export function sendOutboundPing(bot: Farmbot) {
  return new Promise((resolve, reject) => {
    const id = uuid();

    const x = { done: false };

    const ok = () => {
      if (!x.done) {
        x.done = true;
        pingOK(id, now());
        resolve("");
      }
    };

    const no = () => {
      if (!x.done) {
        x.done = true;
        pingNO(id, now());
        reject(new Error("sendOutboundPing failed: " + id));
      }
    };

    dispatchQosStart(id);
    setTimeout(no, PING_TIMEOUT);
    bot.ping().then(ok, no);
  });
}

const beep = (bot: Farmbot) => sendOutboundPing(bot)
  .then(() => { }, () => { }); // Silence errors;

export function startPinging(bot: Farmbot) {
  beep(bot);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(() => beep(bot), PING_INTERVAL);
}

export function pingAPI() {
  const ok = () => dispatchNetworkUp("user.api", now());
  const no = () => dispatchNetworkDown("user.api", now());
  return axios.get(API.current.devicePath).then(ok, no);
}
