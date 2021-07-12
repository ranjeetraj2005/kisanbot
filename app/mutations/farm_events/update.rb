module FarmEvents
  class Update < Mutations::Command
    NOT_YOURS = "Not your farm_event."

    include FarmEvents::ExecutableHelpers
    include FarmEvents::FragmentHelpers
    include FarmEvents::OccurrenceHelpers
    using Sequences::CanonicalCeleryHelpers

    has_executable_fields

    required do
      model :farm_event, class: FarmEvent
      model :device, class: Device
    end

    optional do
      integer :repeat, min: 1
      string :time_unit, in: FarmEvent::UNITS_OF_TIME
      time :start_time, after: Time.now - 20.years
      time :end_time, before: Time.now + 20.years
      body
    end

    def validate
      validate_executable if (executable_id || executable_type)
      validate_ownership
      validate_occurrences(start_time: start_time || farm_event.start_time,
                           end_time: end_time || farm_event.end_time,
                           time_unit: time_unit || farm_event.time_unit,
                           repeat: repeat || farm_event.repeat)
    end

    def execute
      p = inputs.except(:farm_event, :body, :device)
      # Keeps cleanup operations on schedule:
      p[:end_time] = next_start_time + 1.minute if is_one_time_event
      FarmEvent.auto_sync_debounce do
        FarmEvent.transaction do
          handle_body_field
          farm_event.update!(p)
          farm_event
        end
      end
    end

    def validate_ownership
      raise Errors::Forbidden, NOT_YOURS if farm_event.device != device
    end

    def is_one_time_event
      next_time_unit == FarmEvent::NEVER
    end

    # The FarmEvent's time_unit, after saving completes.
    # Defaults to farm_event.time_unit if the user is not updating that field.
    def next_time_unit
      (time_unit || farm_event.time_unit)
    end

    # The FarmEvent's start_Time, after saving completes.
    # Defaults to farm_event.start_time if the user is not updating that field.
    def next_start_time
      (start_time || farm_event.start_time)
    end
  end
end
