# frozen_string_literal: true

# Cards at a JLPT level the user has never studied — the "new" half of a
# flashcard session, capped per type by UserCardProgress::NEW_PER_DAY.
#
# `type` is one of CardCatalog::TYPES, or "all" to draw from every type at once
# (each still respecting its own daily cap). The single-type and all-types
# paths used to be two separate blocks in the controller that had drifted:
# one loaded the studied-id list per type, the other for every type at once.
class NewCardsQuery
  Result = Struct.new(:total, :cards) # cards: [[type, record], …]

  def initialize(user, type:, level:)
    @user  = user
    @type  = type.to_s
    @level = level
  end

  def types
    type == "all" ? CardCatalog::TYPES : [ type ]
  end

  def call
    total = 0
    cards = []

    types.each do |card_type|
      scope  = unstudied(card_type)
      total += scope.count
      cards += scope.limit(daily_cap(card_type)).map { |record| [ card_type, record ] }
    end

    Result.new(total, cards)
  end

  private

  attr_reader :user, :type, :level

  def unstudied(card_type)
    CardCatalog.model_for(card_type)
               .by_level(level)
               .where.not(id: studied_ids.fetch(card_type, []))
               .order(:id)
  end

  def daily_cap(card_type)
    UserCardProgress::NEW_PER_DAY.fetch(card_type, 10)
  end

  # One query for every type asked about, rather than one per type.
  def studied_ids
    @studied_ids ||= user.user_card_progresses
                         .where(card_type: types)
                         .pluck(:card_type, :card_id)
                         .group_by(&:first)
                         .transform_values { |pairs| pairs.map(&:last) }
  end
end
