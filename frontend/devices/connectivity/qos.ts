import { betterCompact } from "../../util";

interface Pending {
  kind: "pending";
  start: number;
}

interface Timeout {
  kind: "timeout";
  start: number;
  end: number;
}

export interface PingComplete {
  kind: "complete";
  start: number;
  end: number;
}

export type Ping = PingComplete | Pending | Timeout;
export type PingDictionary = Record<string, Ping | undefined>;

export const now = () => (new Date()).getTime();

export const startPing =
  (s: PingDictionary, id: string): PingDictionary => {
    return { ...s, [id]: { kind: "pending", start: now() } };
  };

export const failPing =
  (s: PingDictionary, id: string): PingDictionary => {
    const failure = s[id];
    if (failure && failure.kind != "complete") {
      const nextFailure: Timeout = {
        kind: "timeout",
        start: failure.start,
        end: now(),
      };
      return { ...s, [id]: nextFailure };
    }

    return s;
  };

export const completePing =
  (s: PingDictionary, id: string, end = now()): PingDictionary => {
    const failure = s[id];
    if (failure && failure.kind == "pending") {
      return {
        ...s,
        [id]: {
          kind: "complete",
          start: failure.start,
          end
        }
      };
    }
    return s;
  };

type PingLossReport = Record<Ping["kind"] | "total", number>;

const getAll = (s: PingDictionary) => betterCompact(Object.values(s));

export const calculatePingLoss = (s: PingDictionary): PingLossReport => {
  const all = getAll(s);
  const report: PingLossReport = {
    complete: 0,
    pending: 0,
    timeout: 0,
    total: 0,
  };

  all.map(p => report[p.kind] += 1);
  report.total = all.filter(p => p.kind != "pending").length;

  return report;
};

interface LatencyReport {
  best: number;
  worst: number;
  average: number;
  total: number;
}

const mapper = (p: Ping) => (p.kind === "complete")
  ? p.end - p.start
  : undefined;

export const calculateLatency =
  (s: PingDictionary): LatencyReport => {
    let latency: number[] =
      betterCompact(getAll(s).map(mapper));
    // Prevents "Infinity" from showing up in UI
    // when the app is loading or the bot is 100%
    // offline:
    if (latency.length == 0) { latency = [0]; }
    const average = Math.round(latency.reduce((a, b) => a + b, 0) / latency.length);

    const report = {
      best: Math.abs(Math.min(...latency)),
      worst: Math.max(...latency),
      average,
      total: latency.length
    };

    /** SIDE EFFECT WARNING: We do analytics on every nth ping to gauge
     * overall system health. This is the least invasive place to put it. */
    const doReport = !!report.total && !(report.total % 100);
    doReport && window.logStore.log("FBOS Ping QoS Message", report, "info");
    return report;
  };
