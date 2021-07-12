import React from "react";
import { Color } from "../../../../ui/index";
import { BotOriginQuadrant } from "../../../interfaces";
import { ToolPulloutDirection } from "farmbot/dist/resources/api_resources";

enum Anchor {
  start = 0,
  middleTop = 1,
  end = 2,
  middleBottom = 3
}

export const textAnchorPosition = (
  pulloutDirection: ToolPulloutDirection,
  quadrant: BotOriginQuadrant,
  xySwap: boolean,
  gantryMounted: boolean,
): { x: number, y: number, anchor: string } => {
  const rawAnchor = () => {
    const noDirection = !pulloutDirection || gantryMounted;
    const noDirectionXY = xySwap
      ? ToolPulloutDirection.POSITIVE_Y
      : ToolPulloutDirection.POSITIVE_X;
    const direction = noDirection
      ? noDirectionXY
      : pulloutDirection + (xySwap ? 2 : 0);
    switch (direction > 4 ? direction % 4 : direction) {
      case ToolPulloutDirection.POSITIVE_X: return Anchor.start;
      case ToolPulloutDirection.NEGATIVE_X: return Anchor.end;
      case ToolPulloutDirection.NEGATIVE_Y: return Anchor.middleTop;
      case ToolPulloutDirection.POSITIVE_Y: return Anchor.middleBottom;
      default: return Anchor.start;
    }
  };
  const adjustAnchor = (anchor: Anchor) => {
    const horizontal = anchor === Anchor.end || anchor === Anchor.start;
    switch (quadrant) {
      case 1: return anchor + 2;
      case 2: return horizontal ? anchor : anchor + 2;
      case 3: return anchor;
      case 4: return horizontal ? anchor + 2 : anchor;
      default: return anchor;
    }
  };
  switch (adjustAnchor(rawAnchor()) % 4) {
    case Anchor.end: return { anchor: "end", x: -40, y: 10 };
    case Anchor.middleTop: return { anchor: "middle", x: 0, y: 60 };
    case Anchor.middleBottom: return { anchor: "middle", x: 0, y: -40 };
    case Anchor.start:
    default:
      return { anchor: "start", x: 40, y: 10 };
  }
};

interface ToolLabelProps {
  toolName: string | undefined;
  hovered: boolean;
  x: number;
  y: number;
  pulloutDirection: ToolPulloutDirection;
  quadrant: BotOriginQuadrant;
  xySwap: boolean;
  gantryMounted: boolean;
}

export const ToolLabel = (props: ToolLabelProps) => {
  const {
    toolName, hovered, x, y, pulloutDirection, quadrant, xySwap, gantryMounted,
  } = props;
  const labelAnchor =
    textAnchorPosition(pulloutDirection, quadrant, xySwap, gantryMounted);
  return <text textAnchor={labelAnchor.anchor}
    visibility={hovered ? "visible" : "hidden"}
    x={x}
    y={y}
    dx={labelAnchor.x}
    dy={labelAnchor.y}
    fontSize={24}
    fill={Color.darkGray}>
    {toolName}
  </text>;
};
