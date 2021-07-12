module Api
  class AlertsController < Api::AbstractController
    def index
      maybe_paginate current_device.alerts
    end

    def destroy
      mutate Alerts::Destroy.run(alert: alert)
    end

    private

    def alert
      @alert ||= current_device.alerts.find(params[:id])
    end
  end
end
