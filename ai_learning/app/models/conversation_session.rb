class ConversationSession < ApplicationRecord
  JLPT_LEVELS  = %w[n5 n4 n3 n2 n1].freeze
  ROLES        = %w[tutor convenience_store_clerk restaurant_staff office_colleague hotel_staff airport_staff].freeze
  MAX_MESSAGES = 50  # keep last 50 turns (~25 user + 25 AI) per session

  belongs_to :user

  after_initialize { self.messages ||= [] }

  validates :role,       presence: true, inclusion: { in: ROLES }
  validates :jlpt_level, presence: true, inclusion: { in: JLPT_LEVELS }

  scope :recent,   -> { order(updated_at: :desc) }
  scope :by_level, ->(level) { where(jlpt_level: level) }
  scope :by_role,  ->(role)  { where(role: role) }

  # Append a message. AI messages may carry structured metadata.
  def add_message(role:, content:, corrections: nil, new_words: nil, translation_vi: nil)
    msg = { "role" => role, "content" => content, "timestamp" => Time.current.iso8601 }
    msg["corrections"]    = corrections    if corrections.present?
    msg["new_words"]      = new_words      if new_words.present?
    msg["translation_vi"] = translation_vi if translation_vi.present?
    messages << msg
    messages.shift while messages.size > MAX_MESSAGES
    save!
  end
end
