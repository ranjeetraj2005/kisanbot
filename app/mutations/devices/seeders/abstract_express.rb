module Devices
  module Seeders
    class AbstractExpress < AbstractGenesis
      def settings_device_name
        device.update!(name: "FarmBot Express")
      end

      def peripherals_peripheral_4; end
      def peripherals_peripheral_5; end

      def sensors_soil_sensor; end
      def sensors_tool_verification; end

      def settings_change_firmware_config_defaults
        device.firmware_config.update!(movement_max_spd_x: 800,
                                       movement_max_spd_y: 900,
                                       movement_max_spd_z: 1000,
                                       movement_max_spd_z2: 500,
                                       movement_min_spd_x: 300,
                                       movement_min_spd_y: 300,
                                       movement_min_spd_z: 375,
                                       movement_min_spd_z2: 375,
                                       movement_home_spd_x: 800,
                                       movement_home_spd_y: 900,
                                       movement_home_spd_z: 500,
                                       movement_steps_acc_dec_x: 60,
                                       movement_steps_acc_dec_y: 60,
                                       movement_steps_acc_dec_z: 75,
                                       movement_steps_acc_dec_z2: 75,
                                       movement_motor_current_x: 800,
                                       movement_motor_current_y: 800,
                                       encoder_missed_steps_max_x: 60,
                                       encoder_missed_steps_max_y: 60,
                                       encoder_missed_steps_max_z: 70,
                                       encoder_missed_steps_decay_x: 100,
                                       encoder_missed_steps_decay_y: 100,
                                       encoder_missed_steps_decay_z: 100)
      end

      def tool_slots_slot_1
        add_tool_slot(name: ToolNames::SEED_TROUGH_1,
                      x: 0,
                      y: 25,
                      z: 0,
                      tool: tools_seed_trough_1,
                      pullout_direction: ToolSlot::NONE,
                      gantry_mounted: true)
      end

      def tool_slots_slot_2
        add_tool_slot(name: ToolNames::SEED_TROUGH_2,
                      x: 0,
                      y: 50,
                      z: 0,
                      tool: tools_seed_trough_2,
                      pullout_direction: ToolSlot::NONE,
                      gantry_mounted: true)
      end

      def tool_slots_slot_3; end
      def tool_slots_slot_4; end
      def tool_slots_slot_5; end
      def tool_slots_slot_6; end
      def tool_slots_slot_7; end
      def tool_slots_slot_8; end
      def tool_slots_slot_9; end
      def tools_seed_bin; end
      def tools_seed_tray; end

      def tools_seed_trough_1
        @tools_seed_trough_1 ||=
          add_tool(ToolNames::SEED_TROUGH_1)
      end

      def tools_seed_trough_2
        @tools_seed_trough_2 ||=
          add_tool(ToolNames::SEED_TROUGH_2)
      end

      def tools_seeder; end
      def tools_soil_sensor; end
      def tools_watering_nozzle; end
      def tools_weeder; end
      def tools_rotary; end
      def sequences_mount_tool; end

      def sequences_pick_up_seed
        s = SequenceSeeds::PICK_UP_SEED_EXPRESS.deep_dup

        s.dig(:body, 1, :body, 0, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 1, :body, 1, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 1, :body, 2, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 2, :args, :pin_number, :args)[:pin_id] = vacuum_id
        s.dig(:body, 3, :body, 0, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 3, :body, 1, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 3, :body, 2, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 4, :body, 0, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 4, :body, 1, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        s.dig(:body, 4, :body, 2, :args, :axis_operand, :args)[:tool_id] = seed_trough_1_id
        Sequences::Create.run!(s, device: device)
      end

      def sequences_tool_error; end
      def sequences_unmount_tool; end

      def settings_default_map_size_y
        device.web_app_config.update!(map_size_y: 1_200)
      end

      def settings_hide_sensors
        device.web_app_config.update!(hide_sensors: true)
      end

      private

      def seed_trough_1_id
        @seed_trough_1_id ||= device.tools.find_by!(name: ToolNames::SEED_TROUGH_1).id
      end
    end
  end
end
