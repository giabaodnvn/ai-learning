# frozen_string_literal: true

# SrsReviewService — applies a single spaced-repetition review to a
# UserCardProgress and records the daily study activity, atomically.
#
# `progress` may be a persisted row or a new (unsaved) record that already has
# its initial SRS state assigned (see SrsService.initial_state). The SRS
# advancement is always computed from the state persisted at commit time:
#   - existing row: locked and re-read inside the transaction so two concurrent
#     submits stack instead of both computing from the same base (lost update);
#   - new row: a concurrent first-insert collision on the uq_user_card unique
#     index is retried, re-finding the now-persisted row and stacking on top of
#     it — identical to two sequential requests instead of an unhandled 500.
#
# Returns the final (persisted) progress.
class SrsReviewService
  def self.apply!(user:, progress:, grade:)
    attempts = 0
    begin
      ActiveRecord::Base.transaction do
        progress.lock! unless progress.new_record?

        result = SrsService.calculate_next_review(
          ease_factor: progress.ease_factor.to_f,
          interval:    progress.interval,
          repetitions: progress.repetitions,
          grade:       grade
        )

        progress.assign_attributes(
          interval:         result[:new_interval],
          ease_factor:      result[:new_ease_factor],
          repetitions:      result[:new_repetitions],
          due_date:         result[:due_date],
          last_reviewed_at: Time.current,
          learned:          grade >= 2 ? true : progress.learned  # grade 2-3 marks as learned; 0-1 leaves unchanged
        )

        progress.save!
        StudyLog.record!(user_id: user.id, correct: grade >= 2)
        user.record_study_session!
      end
    rescue ActiveRecord::RecordNotUnique
      attempts += 1
      raise if attempts >= 2

      # A concurrent first-insert won the unique index; re-find the persisted
      # row (no longer a new_record) and stack this review on top of it.
      progress = user.user_card_progresses.find_or_initialize_by(
        card_type: progress.card_type, card_id: progress.card_id
      )
      retry
    end

    progress
  end
end
