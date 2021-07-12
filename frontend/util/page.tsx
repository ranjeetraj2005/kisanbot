import {
  createElement,
  ComponentClass,
  Attributes,
} from "react";
import { render } from "react-dom";
import { capitalize } from "lodash";
import { t } from "../i18next_wrapper";
import { stopIE } from "./stop_ie";
import { detectLanguage } from "../i18n";
import I from "i18next";

/** Dynamically change the meta title of the page. */
export function updatePageInfo(pageName: string, panel?: string | undefined) {
  if (pageName === "designer") {
    pageName = "Farm Designer";
    if (panel) {
      document.title =
        `${t(capitalize(pageName))}: ${t(capitalize(panel))} - FarmBot`;
      return;
    }
  }
  document.title = `${t(capitalize(pageName))} - FarmBot`;
  // Possibly add meta "content" here dynamically as well
}

export function attachToRoot<P>(
  type: ComponentClass<P> | React.FunctionComponent<P>,
  props?: Attributes & P,
) {
  const node = document.createElement("DIV");
  node.id = "root";
  document.body.appendChild(node);

  const reactElem = createElement(type, props);
  const domElem = document.getElementById("root");

  domElem && render(reactElem, domElem);
}

export function entryPoint(page: ComponentClass | React.FunctionComponent) {
  stopIE();
  detectLanguage().then(conf => I.init(conf, () => attachToRoot(page)));
}
