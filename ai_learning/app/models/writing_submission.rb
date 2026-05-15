# frozen_string_literal: true

class WritingSubmission < ApplicationRecord
  MAX_PER_USER = 100

  belongs_to :user

  validates :text,     presence: true
  validates :feedback, presence: true

  after_create :enforce_limit

  private

  def enforce_limit
    excess = user.writing_submissions.count - MAX_PER_USER
    return unless excess > 0

    ids = user.writing_submissions
              .order(created_at: :asc)
              .limit(excess)
              .pluck(:id)
    WritingSubmission.where(id: ids).delete_all
  end
end
