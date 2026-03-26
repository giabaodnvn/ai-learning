# frozen_string_literal: true

# Pure SM-2 spaced-repetition calculator.
# No database access — takes current card state, returns next state.
#
# Grade scale (4-button):
#   0 = again  (forgot)
#   1 = hard   (remembered with difficulty)
#   2 = good   (remembered after brief hesitation)
#   3 = easy   (instant recall)
#
# Internally mapped to SM-2 quality 0-5 for the ease-factor formula.
class SrsService
  GRADE_TO_QUALITY = { 0 => 0, 1 => 3, 2 => 4, 3 => 5 }.freeze
  MIN_EASE_FACTOR  = 1.3
  DEFAULT_EASE     = 2.5

  # Returns a hash with the updated card state:
  #   {new_interval:, new_ease_factor:, new_repetitions:, due_date:}
  #
  # Parameters reflect the card's state BEFORE this review.
  def self.calculate_next_review(ease_factor:, interval:, repetitions:, grade:)
    raise ArgumentError, "grade must be 0-3" unless (0..3).include?(grade.to_i)

    grade   = grade.to_i
    quality = GRADE_TO_QUALITY.fetch(grade)
    ef      = ease_factor.to_f

    if quality >= 3
      new_reps     = repetitions + 1
      new_interval = next_interval(new_reps, interval, ef)
      new_ef       = [ ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
                       MIN_EASE_FACTOR ].max.round(2)
    else
      # Failed: reset repetitions and schedule for tomorrow.
      # Ease factor is intentionally unchanged (standard SM-2 behaviour).
      new_reps     = 0
      new_interval = 1
      new_ef       = ef.round(2)
    end

    {
      new_interval:     new_interval,
      new_ease_factor:  new_ef,
      new_repetitions:  new_reps,
      due_date:         Date.current + new_interval.days
    }
  end

  # Convenience: build a default progress hash for a brand-new card.
  def self.initial_state
    {
      interval:    1,
      ease_factor: DEFAULT_EASE,
      repetitions: 0,
      due_date:    Date.current
    }
  end

  class << self
    private

    # Standard SM-2 interval progression (repetitions is AFTER increment).
    def next_interval(new_reps, prev_interval, ef)
      case new_reps
      when 1 then 1
      when 2 then 6
      else        (prev_interval * ef).round
      end
    end
  end
end
