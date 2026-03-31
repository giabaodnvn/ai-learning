class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  JLPT_LEVELS = %w[n5 n4 n3 n2 n1].freeze
  VIP_LEVELS  = { free: 0, basic: 1, pro: 2, premium: 3 }.freeze
  VIP_NAMES   = { 0 => "Free", 1 => "Basic", 2 => "Pro", 3 => "Premium" }.freeze

  enum :role,       { student: 0, admin: 1 }, default: :student
  enum :jlpt_level, { n5: "n5", n4: "n4", n3: "n3", n2: "n2", n1: "n1" }, default: :n5

  has_many :user_vocabulary_progresses, dependent: :destroy
  has_many :vocabularies, through: :user_vocabulary_progresses
  has_many :conversation_sessions, dependent: :destroy
  has_many :user_card_progresses, dependent: :destroy
  has_many :study_logs, dependent: :destroy

  validates :name, presence: true, length: { maximum: 100 }
  validates :jlpt_level, inclusion: { in: JLPT_LEVELS }
  validates :streak_count, numericality: { greater_than_or_equal_to: 0 }
  validates :vip_level, inclusion: { in: VIP_LEVELS.values }
  validates :balance, numericality: { greater_than_or_equal_to: 0 }

  def vip?        = vip_level.to_i > 0
  def vip_name    = VIP_NAMES[vip_level.to_i] || "Free"
  def vip_active? = vip? && (vip_expires_at.nil? || vip_expires_at > Time.current)

  # Call on first review of the day to maintain streak.
  # Idempotent: safe to call multiple times in one day.
  def record_study_session!
    today = Date.current
    return if last_studied_at&.to_date == today

    yesterday   = today - 1
    new_streak  = last_studied_at&.to_date == yesterday ? streak_count + 1 : 1
    update_columns(streak_count: new_streak, last_studied_at: Time.current)
  end
end
