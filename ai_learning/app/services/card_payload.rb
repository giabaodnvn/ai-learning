# frozen_string_literal: true

# The JSON envelope every flashcard endpoint wraps a card in: the SRS state
# (due date, interval, ease factor) plus the type-specific content fields from
# CardCatalog.
#
# `due` returns rows the user has already started, `new_cards` and `random`
# return cards with no progress row yet — same shape, so the client can treat
# them uniformly. Keeping both builders here is what makes that guarantee
# checkable in one place.
module CardPayload
  # A card the user has progress on.
  def self.from_progress(progress, card)
    {
      progress_id: progress.id,
      card_type:   progress.card_type,
      card_id:     progress.card_id,
      jlpt_level:  progress.jlpt_level,
      due_date:    progress.due_date,
      repetitions: progress.repetitions,
      interval:    progress.interval,
      ease_factor: progress.ease_factor.to_f
    }.merge(CardCatalog.attributes_for(progress.card_type, card))
  end

  # A card with no progress row: reported at the initial SRS state, due today.
  def self.for_new_card(type, card)
    {
      progress_id: nil,
      card_type:   type,
      card_id:     card.id,
      jlpt_level:  card.jlpt_level,
      due_date:    Date.current.to_s,
      repetitions: 0,
      interval:    1,
      ease_factor: SrsService::DEFAULT_EASE
    }.merge(CardCatalog.attributes_for(type, card))
  end
end
