import React from "react";
import { connect } from "react-redux";
import {
  DesignerPanel, DesignerPanelContent, DesignerPanelTop,
} from "../farm_designer/designer_panel";
import { Panel, DesignerNavTabs } from "../farm_designer/panel_header";
import { Everything } from "../interfaces";
import { Dictionary, JobProgress } from "farmbot";
import { t } from "../i18next_wrapper";

export interface JobsPanelProps {
  jobs: Dictionary<JobProgress | undefined>;
}

export const mapStateToProps = (props: Everything): JobsPanelProps => ({
  jobs: props.bot.hardware.jobs,
});

export class RawJobsPanel extends React.Component<JobsPanelProps, {}> {
  render() {
    return <DesignerPanel panelName={"jobs"} panel={Panel.Logs}>
      <DesignerNavTabs />
      <DesignerPanelTop panel={Panel.Logs} />
      <DesignerPanelContent panelName={"jobs"}>
        <p>{t("Job count")}: {Object.values(this.props.jobs).length}</p>
        <table>
          <thead>
            <tr>
              <th>{t("Job name")}</th>
              <th>{t("Progress")}</th>
              <th>{t("Unit")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(this.props.jobs).map(([title, job]) => {
              if (!job) { return; }
              const percent = job.unit == "percent" && job.percent;
              return <tr key={title}>
                <td className={"job-name"} title={title}>{title}</td>
                <td>
                  {job.unit == "percent" ? job[job.unit] : job[job.unit]}
                  <div className={"progress"}
                    style={percent ? { width: `${percent}%` } : {}} />
                </td>
                <td>{job.unit}</td>
                <td>{job.status}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </DesignerPanelContent>
    </DesignerPanel>;
  }
}

export const JobsPanel = connect(mapStateToProps)(RawJobsPanel);
