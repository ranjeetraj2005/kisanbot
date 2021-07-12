module Configs
  class Update < Mutations::Command
    HOTFIX = [:encoder_scaling_x, :encoder_scaling_y, :encoder_scaling_z]
    BAD = 56
    GOOD = 5556

    required do
      duck :target, methods: [:update!]
      duck :update_attrs, methods: [:deep_symbolize_keys]
    end

    def execute
      target.assign_attributes(sliced_attrs)
      # Remove HOTFIX after November 12, 2019 - RC
      HOTFIX.map do |attr|
        target.assign_attributes(attr => GOOD) if target.try(attr) == BAD
      end
      target.save!
      target
    end

    def sliced_attrs
      allowed = target.class.column_names.map(&:to_sym)
      updates = update_attrs
        .deep_symbolize_keys
        .except(:device_id, :id, :created_at)
      updates.slice(*allowed)
    end
  end
end
