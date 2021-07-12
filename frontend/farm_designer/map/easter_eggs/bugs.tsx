import React from "react";
import { transformXY } from "../util";
import { MapTransformProps, BotSize } from "../interfaces";
import { random, range, some, clamp, sample, every } from "lodash";
import { getEggStatus, setEggStatus, EggKeys } from "./status";
import { t } from "../../../i18next_wrapper";
import { Row, Col } from "../../../ui";
import { ToggleButton } from "../../../ui/toggle_button";
import { getHighlightName } from "../../../settings/maybe_highlight";

export interface BugsProps {
  mapTransformProps: MapTransformProps;
  botSize: BotSize;
}

type Bug = {
  id: number,
  x: number,
  y: number,
  r: number,
  hp: number,
  alive: boolean,
  slug: string
};

interface BugsState {
  bugs: Bug[];
  startTime: number;
}

export function showBugResetButton() {
  return getEggStatus(EggKeys.BRING_ON_THE_BUGS) === "true" &&
    getEggStatus(EggKeys.BUGS_ARE_STILL_ALIVE) === "false";
}

export function showBugs() {
  return getEggStatus(EggKeys.BRING_ON_THE_BUGS) === "true" &&
    getEggStatus(EggKeys.BUGS_ARE_STILL_ALIVE) !== "false";
}

export function resetBugs() {
  setEggStatus(EggKeys.BUGS_ARE_STILL_ALIVE, "true");
}

export function getBugTime() {
  return getEggStatus(EggKeys.LAST_BUG_TIME);
}

const BUGS = [
  "aphid", "caterpillar", "earth-worm", "generic-ant",
  "generic-moth", "june-bug", "ladybug", "roly-poly",
];
const bugFile = (bug: string) => `/app-resources/img/bugs/${bug}.svg`;

export class Bugs extends React.Component<BugsProps, BugsState> {
  state: BugsState = { bugs: [], startTime: NaN };

  componentDidMount() {
    this.setState({
      bugs: range(10).map(id => ({
        id,
        x: random(0, this.xMax),
        y: random(0, this.yMax),
        r: random(25, 100),
        hp: 100,
        alive: true,
        slug: sample(BUGS) || "caterpillar"
      })),
      startTime: this.seconds
    });
  }

  get seconds() { return Math.floor(new Date().getTime() / 1000); }
  get elapsedTime() { return this.seconds - this.state.startTime; }

  onClick = (id: number) => {
    const bugs = this.state.bugs;
    if (bugs[id].r > 100 && bugs[id].hp > 50) {
      bugs[id].hp = 50;
    } else {
      bugs[id].hp = 50;
      bugs[id].alive = false;
    }
    bugs.map(b => {
      if (b.alive) {
        b.x = clamp(b.x + random(-100, 100), 0, this.xMax);
        b.y = clamp(b.y + random(-100, 100), 0, this.yMax);
        b.r = clamp(b.r + random(0, 10), 0, 150);
      }
    });
    if (!some(bugs, "alive")) {
      setEggStatus(EggKeys.BUGS_ARE_STILL_ALIVE, "false");
      setEggStatus(EggKeys.LAST_BUG_TIME, "" + this.elapsedTime);
    }
    this.forceUpdate();
  };

  get xMax() { return this.props.botSize.x.value; }
  get yMax() { return this.props.botSize.y.value; }

  render() {
    const toQ = (ox: number, oy: number) =>
      transformXY(ox, oy, this.props.mapTransformProps);
    return <g id="bugs">
      <filter id="grayscale">
        <feColorMatrix type="saturate" values="0" />
      </filter>
      {this.state.bugs.map(bug => {
        const { qx, qy } = toQ(bug.x, bug.y);
        return <image
          key={Object.values(bug).join("-")}
          className={`bug ${bug.alive ? "" : "dead"}`}
          filter={bug.alive ? "" : "url(#grayscale)"}
          opacity={bug.hp / 100}
          xlinkHref={bugFile(bug.slug)}
          onClick={() => this.onClick(bug.id)}
          height={bug.r * 2}
          width={bug.r * 2}
          x={qx - bug.r}
          y={qy - bug.r} />;
      })}
    </g>;
  }
}

export const BugsControls = () =>
  showBugResetButton()
    ? <div className="more-bugs">
      <button
        className="fb-button green"
        title={t("more bugs!")}
        onClick={resetBugs}>
        {t("more bugs!")}
      </button>
      {getBugTime() &&
        <p>
          {t("{{seconds}} seconds!", { seconds: getBugTime() })}
        </p>}
    </div>
    : <div className={"no-bugs"} />;

const Setting = (title: string, key: string, value: string) => {
  const on = localStorage.getItem(key) == value;
  return <div className={"setting"}>
    <Row>
      <Col xs={9}>
        <label>{title}</label>
      </Col>
      <Col xs={3}>
        <ToggleButton
          toggleValue={on}
          toggleAction={() => localStorage.setItem(key, on ? "" : value)} />
      </Col>
    </Row>
  </div>;
};

export const ExtraSettings = (term: string) => {
  return every([term, getHighlightName()], x => x == "surprise") &&
    <div className={"settings"}>
      {Setting("Bug Attack", EggKeys.BRING_ON_THE_BUGS, "true")}
    </div>;
};
