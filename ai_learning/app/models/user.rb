class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze

  enum :role, { student: 0, admin: 1 }, default: :student
  enum :jlpt_level, { n5: "n5", n4: "n4", n3: "n3", n2: "n2", n1: "n1" }, default: :n5

  has_many :user_vocabulary_progresses, dependent: :destroy
  has_many :vocabularies, through: :user_vocabulary_progresses
  has_many :conversation_sessions, dependent: :destroy
  has_many :user_card_progresses, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
  validates :jlpt_level, inclusion: { in: JLPT_LEVELS }
  validates :streak_count, numericality: { greater_than_or_equal_to: 0 }
end
