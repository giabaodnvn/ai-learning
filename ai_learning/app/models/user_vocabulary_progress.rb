class UserVocabularyProgress < ApplicationRecord
  belongs_to :user
  belongs_to :vocabulary

  validates :interval,     presence: true, numericality: { greater_than: 0 }
  validates :ease_factor,  presence: true, numericality: { greater_than_or_equal_to: 1.3 }
  validates :repetitions,  presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :due_date,     presence: true

  scope :due_today,    -> { where(due_date: ..Date.current) }
  scope :due_for_user, ->(user) { where(user: user).due_today }

  # SM-2 algorithm: update interval and ease_factor after a review
  # quality: 0-5 (0-1 = fail, 2-5 = pass)
  def review!(quality)
    raise ArgumentError, "quality must be 0-5" unless (0..5).include?(quality)

    if quality >= 3
      self.repetitions  += 1
      self.interval      = calculate_next_interval
      self.ease_factor   = [ ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)), 1.3 ].max
    else
      self.repetitions = 0
      self.interval    = 1
    end

    self.due_date        = Date.current + interval.days
    self.last_reviewed_at = Time.current
    save!
  end

  private

  def calculate_next_interval
    case repetitions
    when 1 then 1
    when 2 then 6
    else (interval * ease_factor).round
    end
  end
end
