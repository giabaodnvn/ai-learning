# frozen_string_literal: true

module Api
  module V1
    module Concerns
      # Reading and validating a JLPT level out of the params.
      #
      # Six controllers each had their own version of this: two spelled the
      # level list inline as `%w[n1 n2 n3 n4 n5]` instead of using
      # JlptLeveled::JLPT_LEVELS, one forgot to downcase, and the 422 body was
      # written out by hand at each call site.
      module LevelScoped
        extend ActiveSupport::Concern

        private

        # The requested level, normalised to lowercase; nil when absent.
        def level_param(key = :level)
          params[key].presence&.downcase
        end

        # The requested level, or the user's own when the param is absent.
        # A present-but-invalid value is passed through so the caller can 422 it.
        def level_param_or_user(key = :level)
          level_param(key) || current_user.jlpt_level
        end

        # Like `level_param_or_user`, but also falls back to the user's level
        # when the value isn't a JLPT level — for endpoints that treat a bad
        # level as "unspecified" rather than as an error.
        def valid_level_or_user(key = :level)
          level = level_param(key)
          valid_level?(level) ? level : current_user.jlpt_level
        end

        def valid_level?(level)
          JlptLeveled::JLPT_LEVELS.include?(level)
        end
      end
    end
  end
end
