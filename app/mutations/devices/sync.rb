module Devices
  class Sync < Mutations::Command
    SEL = "SELECT id, updated_at FROM"
    WHERE = "WHERE device_id = "
    FORMAT = "%Y-%m-%d %H:%M:%S.%5N"

    def self.basic_query(plural_resource, where = WHERE)
      [SEL, plural_resource, where].join(" ")
    end

    QUERIES = {
      devices: basic_query("devices", "WHERE id = "),
      farm_events: basic_query("farm_events"),
      farmware_envs: basic_query("farmware_envs"),
      farmware_installations: basic_query("farmware_installations"),
      peripherals: basic_query("peripherals"),
      pin_bindings: basic_query("pin_bindings"),
      points: basic_query("points"),
      regimens: basic_query("regimens"),
      # sensor_readings: basic_query("sensor_readings"),
      sensors: basic_query("sensors"),
      sequences: basic_query("sequences"),
      tools: basic_query("tools"),
      fbos_configs: basic_query("fbos_configs"),
      firmware_configs: basic_query("firmware_configs"),
      point_groups: basic_query("point_groups"),
    }

    STUB_FARMWARES = Api::FirstPartyFarmwaresController::STUBS.values.map do |x|
      [x.fetch(:id).to_i, x.fetch(:updated_at).as_json]
    end

    required { model :device, class: Device }

    def validate
      device.update!(last_saw_api: Time.now)
      maybe_mark_first_contact
    end

    def execute
      conn = ActiveRecord::Base.connection
      real_stuff = QUERIES.reduce({}) do |acc, (key, value)|
        acc.update(key => conn.execute(value + device.id.to_s).values)
      end
      real_stuff.merge({
        first_party_farmwares: STUB_FARMWARES,
        sensor_readings: [],
      })
    end

    def maybe_mark_first_contact
      if !device.first_saw_api
        device.update!(first_saw_api: Time.now)
      end
    end
  end
end
