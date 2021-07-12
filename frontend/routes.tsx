import React from "react";
import { store as _store } from "./redux/store";
import { history } from "./history";
import { Store } from "./redux/interfaces";
import { ready } from "./config/actions";
import { Session } from "./session";
import { attachToRoot } from "./util";
import { ErrorBoundary } from "./error_boundary";
import { Router } from "takeme";
import { UnboundRouteConfig, UNBOUND_ROUTES } from "./route_config";
import { App } from "./app";
import { ConnectedComponent, Provider } from "react-redux";

interface RootComponentProps { store: Store; }

export const attachAppToDom = () => {
  attachToRoot(RootComponent, { store: _store });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _store.dispatch(ready() as any);
};

export type AnyConnectedComponent =
  ConnectedComponent<React.ComponentType, unknown>;

interface RootComponentState {
  Route: AnyConnectedComponent | React.FunctionComponent;
  ChildRoute?: AnyConnectedComponent;
}

export type ChangeRoute = (
  Route: AnyConnectedComponent | React.FunctionComponent,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info?: UnboundRouteConfig<any, any> | undefined,
  ChildRoute?: AnyConnectedComponent | undefined,
) => void;

export class RootComponent
  extends React.Component<RootComponentProps, RootComponentState> {
  state: RootComponentState = {
    Route: (_: { children?: React.ReactElement }) => <div>Loading...</div>
  };

  UNSAFE_componentWillMount() {
    const notLoggedIn = !Session.fetchStoredToken();
    const currentLocation = history.getCurrentLocation().pathname;
    const restrictedArea = currentLocation.includes("/app");
    (notLoggedIn && restrictedArea && Session.clear());
  }

  changeRoute: ChangeRoute = (Route, _info, ChildRoute) => {
    this.setState({ Route, ChildRoute });
  }

  componentDidMount() {
    const mainRoutes = UNBOUND_ROUTES.map(bindTo => bindTo(this.changeRoute));
    new Router(mainRoutes).enableHtml5Routing("/app").init();
  }

  render() {
    const { Route, ChildRoute } = this.state;
    return <ErrorBoundary>
      <Provider store={_store}>
        <App>
          <Route>
            {ChildRoute && <ChildRoute />}
          </Route>
        </App>
      </Provider>
    </ErrorBoundary>;
  }
}
