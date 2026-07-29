# frozen_string_literal: true

# The AI spend report behind both cost screens: the HTML admin panel
# (Admin::AiCostsController) and the JSON endpoint
# (Api::V1::Admin::AiCostsController). They used to carry the same three
# aggregate calls and the same "week or month" ternary each.
class AiCostReport
  RANGES = { "week" => 7.days, "month" => 30.days }.freeze
  DEFAULT_RANGE = "week"

  attr_reader :range, :from

  def initialize(range: nil)
    @range = RANGES.key?(range.to_s) ? range.to_s : DEFAULT_RANGE
    @from  = RANGES.fetch(@range).ago
  end

  def by_feature
    @by_feature ||= AiUsageLog.aggregate_by_feature(from: from)
  end

  def daily
    @daily ||= AiUsageLog.daily_breakdown(from: from)
  end

  def totals
    @totals ||= AiUsageLog.totals_from(by_feature)
  end

  def as_json(*)
    {
      range:      range,
      from:       from.to_date.to_s,
      by_feature: by_feature,
      daily:      daily,
      totals:     totals
    }
  end
end
