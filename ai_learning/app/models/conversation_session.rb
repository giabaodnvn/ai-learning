class ConversationSession < ApplicationRecord
  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze
  ROLES = %w[free_talk interview debate story shopping travel].freeze

  belongs_to :user

  enum :jlpt_level, { n5: "n5", n4: "n4", n3: "n3", n2: "n2", n1: "n1" }

  after_initialize { self.messages ||= [] }

  validates :role,       presence: true, inclusion: { in: ROLES }
  validates :jlpt_level, presence: true, inclusion: { in: JLPT_LEVELS }
  validates :messages,   presence: false

  scope :recent,     -> { order(created_at: :desc) }
  scope :by_level,   ->(level) { where(jlpt_level: level) }
  scope :by_role,    ->(role)  { where(role: role) }

  def add_message(role:, content:)
    messages << { role: role, content: content, timestamp: Time.current.iso8601 }
    save!
  end
end
