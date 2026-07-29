# frozen_string_literal: true

# Shared JLPT-level behaviour for every model that stores a level in a
# lowercase `jlpt_level` string column ("n5".."n1").
#
# The level list, the presence/inclusion validation and the `by_level` scope
# used to be copy-pasted across eight models with small drifts (some guarded
# `level.present?`, some did not). Including this concern keeps
# `Model::JLPT_LEVELS` resolvable — Ruby looks constants up through the
# ancestor chain — so existing call sites keep working.
module JlptLeveled
  extend ActiveSupport::Concern

  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze

  included do
    validates :jlpt_level, presence: true, inclusion: { in: JLPT_LEVELS }

    scope :by_level, ->(level) { where(jlpt_level: level) if level.present? }
  end
end
