class ConversationSession < ApplicationRecord
  include JlptLeveled

  # The prompt configs own the role list: each role needs a persona and an
  # opening line to be usable at all. This used to be a second hand-maintained
  # copy of those keys, so a role added to one list was rejected by the other.
  ROLES        = Prompts::ConversationTutorPrompt::ROLES
  MAX_MESSAGES = 50  # keep last 50 turns (~25 user + 25 AI) per session

  belongs_to :user

  after_initialize { self.messages ||= [] }

  validates :role, presence: true, inclusion: { in: ROLES }

  scope :recent, -> { order(updated_at: :desc) }

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
