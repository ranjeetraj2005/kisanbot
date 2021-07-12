module Peripherals
  class Update < Mutations::Command
    required do
      model :peripheral, class: Peripheral
      model :device, class: Device
    end

    optional do
      integer :pin
      integer :mode
      string :label
    end

    def execute
      peripheral.update!(inputs.except(:peripheral, :device))
      peripheral
    end
  end
end
