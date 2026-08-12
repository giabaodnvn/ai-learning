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
  #
  # Locked, because appending to a JSON column is a read-modify-write of the
  # whole array: two requests that each loaded the row before either saved
  # would both write their own copy, and the first message would vanish with no
  # error. (Two tabs open on the same conversation is enough to hit it — the
  # client only guards against a double-send within one tab.) `with_lock`
  # reloads inside the transaction, so the append always lands on the newest
  # array rather than the one this instance happened to load with.
  def add_message(role:, content:, corrections: nil, new_words: nil, translation_vi: nil)
    msg = { "role" => role, "content" => content, "timestamp" => Time.current.iso8601 }
    msg["corrections"]    = corrections    if corrections.present?
    msg["new_words"]      = new_words      if new_words.present?
    msg["translation_vi"] = translation_vi if translation_vi.present?

    with_lock do
      messages << msg
      messages.shift while messages.size > MAX_MESSAGES
      save!
    end
  end
end
