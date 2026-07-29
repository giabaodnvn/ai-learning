# frozen_string_literal: true

# Universal SRS progress record for any study content type.
# card_type: "vocabulary" | "kanji" | "grammar_point"
# jlpt_level is denormalized so we can filter due cards by level in one query.
# `learned` is set to true when the user answers correctly in quiz mode (grade >= 2 in SRS mode).
class UserCardProgress < ApplicationRecord
  belongs_to :user

  NEW_PER_DAY = { "vocabulary" => 10, "kanji" => 10, "grammar_point" => 3 }.freeze

  # CardCatalog owns the type → model mapping, so it owns the valid list too.
  validates :card_type,   presence: true, inclusion: { in: CardCatalog::TYPES }
  validates :card_id,     presence: true
  validates :jlpt_level,  presence: true
  validates :interval,    presence: true, numericality: { greater_than: 0 }
  validates :ease_factor, presence: true, numericality: { greater_than_or_equal_to: 1.3 }
  validates :repetitions, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :due_date,    presence: true

  scope :due_today,    -> { where("due_date <= ?", Date.current) }
  scope :for_type,     ->(t)     { where(card_type: t) }
  scope :for_level,    ->(level) { where(jlpt_level: level) }
  scope :learned,      -> { where(learned: true) }

  # Find the user's progress row for a card, or build a new (unsaved) one
  # pre-populated with the initial SRS state at the given JLPT level.
  def self.find_or_build_for(user, card_type:, card_id:, jlpt_level:)
    progress = user.user_card_progresses.find_or_initialize_by(card_type: card_type, card_id: card_id)
    progress.assign_attributes(SrsService.initial_state.merge(jlpt_level: jlpt_level)) if progress.new_record?
    progress
  end

  # Set the learned flag for a card, creating the progress row if absent.
  # Retries once on a concurrent first-insert collision (uq_user_card unique
  # index) — mirrors SrsReviewService.apply! — so two simultaneous writes stack
  # instead of raising a 500.
  #
  # `learned` is cast rather than assigned raw: it arrives straight off the
  # wire, and a form-encoded `learned=false` is the *string* "false", which is
  # truthy in Ruby and used to mark the card learned.
  def self.set_learned!(user, card_type:, card:, learned:)
    flag = ActiveModel::Type::Boolean.new.cast(learned) || false

    attempts = 0
    begin
      progress = find_or_build_for(
        user, card_type: card_type, card_id: card.id, jlpt_level: card.jlpt_level
      )
      progress.update!(learned: flag)
      progress
    rescue ActiveRecord::RecordNotUnique
      attempts += 1
      raise if attempts >= 2

      retry
    end
  end
end
