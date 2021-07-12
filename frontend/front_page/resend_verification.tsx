import { Col, Widget, WidgetHeader } from "../ui/index";
import axios, { AxiosResponse } from "axios";
import React from "react";
import { API } from "../api/index";
import { UnsafeError } from "../interfaces";
import { ResendPanelBody } from "./resend_panel_body";
import { t } from "../i18next_wrapper";

interface ResendVerificationProps {
  email: string;
  /** Callback when resend succeeds */
  ok(resp: AxiosResponse): void;
  /** Callback when resend fails */
  no(error: UnsafeError): void;
  onGoBack(): void;
}

export class ResendVerification
  extends React.Component<ResendVerificationProps, {}> {
  render() {
    return <Col xs={12} sm={5} smOffset={1} mdOffset={0}>
      <Widget>
        <WidgetHeader title={t("Account Not Verified")}>
          <button onClick={this.props.onGoBack}
            type="button"
            title={t("go back")}
            className="fb-button gray pull-right front-page-button">
            {t("back")}
          </button>
        </WidgetHeader>
        <ResendPanelBody onClick={() => resendEmail(this.props.email)
          .then(this.props.ok, this.props.no)} />
      </Widget>
    </Col>;
  }
}

export function resendEmail(email: string) {
  return axios.post(API.current.userResendConfirmationPath, { email });
}
