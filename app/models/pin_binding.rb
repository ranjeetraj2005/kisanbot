class PinBinding < ApplicationRecord
  OFF_LIMITS = [
    2, 3, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 23, 24, 25, 27,
  ]
  BAD_PIN_NUM = "The following pin numbers cannot be used: %s" % OFF_LIMITS.join(", ")

  belongs_to :device
  belongs_to :sequence
  enum special_action: { emergency_lock: "emergency_lock",
                         emergency_unlock: "emergency_unlock",
                         power_off: "power_off",
                         read_status: "read_status",
                         reboot: "reboot",
                         sync: "sync",
                         take_photo: "take_photo" }
  validates :pin_num, uniqueness: { scope: :device }

  def fancy_name
    "pin #{pin_num}"
  end

  def random_pin_num
    [*(0..27)]
      .without(*OFF_LIMITS)
      .without(*device.pin_bindings.pluck(:pin_num))
      .sample
  end
end
