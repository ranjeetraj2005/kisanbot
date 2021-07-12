module PointGroups
  module ClassLevelHelpers
    def criteria
      self.optional do
        hash :criteria do
          hash(:day) do
            string :op, in: [">", "<"]
            integer :days_ago
          end
          hash(:string_eq) { array :*, class: String }
          hash(:number_eq) { array :*, class: Integer }
          hash(:number_lt) { integer :* }
          hash(:number_gt) { integer :* }
        end
      end
    end
  end

  module Helpers
    BAD_POINT_IDS = "The group contains invalid points."
    def self.included(base)
      base.extend PointGroups::ClassLevelHelpers
    end

    def points
      @points ||= Point.where(id: point_ids, device: device)
    end

    def validate_point_ids
      unless point_ids.sort! == points.pluck(:id).sort
        add_error :points, :points_bad, BAD_POINT_IDS
      end
    end

    def validate_sort_type
      if sort_type
        bad_sort_type! unless valid_point_type?
      end
    end

    def bad_sort_type!
      add_error :sort_type,
                :sort_type_bad,
                PointGroup::BAD_SORT % { value: sort_type }
    end

    def valid_point_type?
      PointGroup::SORT_TYPES.include?(sort_type)
    end
  end
end
