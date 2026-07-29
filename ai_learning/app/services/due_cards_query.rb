# frozen_string_literal: true

# The "cards due today" page shared by the flashcard deck and the SRS review
# screen: same filters (card type + JLPT level), same 20-row page, same
# batch-load of the content records behind the progress rows.
#
# Only the JSON shape differs between the two endpoints, so each controller
# keeps its own serializer and calls this for the query.
class DueCardsQuery
  LIMIT = 20

  Result = Struct.new(:total, :progresses, :records) do
    # Yield each progress row with its content record, skipping rows whose
    # content was deleted. Returns the mapped, compacted array.
    def each_card
      progresses.filter_map do |progress|
        record = records["#{progress.card_type}:#{progress.card_id}"]
        yield(progress, record) if record
      end
    end
  end

  # `type` — "all" or one of CardCatalog::TYPES; `level` — "n5".."n1" or nil.
  def initialize(user, type: "all", level: nil)
    @user  = user
    @type  = type
    @level = level
  end

  def call
    progresses = scope.limit(LIMIT).to_a

    Result.new(scope.count, progresses, CardCatalog.batch_load(progresses))
  end

  private

  attr_reader :user, :type, :level

  def scope
    @scope ||= begin
      relation = user.user_card_progresses.due_today.order(:due_date)
      relation = relation.for_type(type)   unless type == "all"
      relation = relation.for_level(level) if level
      relation
    end
  end
end
