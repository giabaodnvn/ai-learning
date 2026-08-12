class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  include JlptLeveled

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  VIP_LEVELS = { free: 0, basic: 1, pro: 2, premium: 3 }.freeze
  # level → display name, derived from VIP_LEVELS so the two can't drift.
  # AdminHelper#vip_badge reads this; it used to keep a second copy.
  VIP_NAMES  = VIP_LEVELS.to_h { |name, level| [ level, name.to_s.capitalize ] }.freeze

  enum :role, { student: 0, admin: 1 }, default: :student

  # jlpt_level is NOT an enum: JlptLeveled validates it, and the users table
  # already defaults the column to "n5". An enum here would turn a bad value
  # submitted to the profile / admin update forms into an ArgumentError (500)
  # before validation could return a 422.

  has_many :conversation_sessions, dependent: :destroy
  has_many :user_card_progresses, dependent: :destroy
  has_many :study_logs, dependent: :destroy
  has_many :level_test_attempts, dependent: :destroy
  has_many :listening_attempts, dependent: :destroy
  has_many :writing_submissions, dependent: :destroy

  validates :name, length: { maximum: 100 }, allow_blank: true
  validates :streak_count, numericality: { greater_than_or_equal_to: 0 }
  validates :vip_level, inclusion: { in: VIP_LEVELS.values }
  validates :balance, numericality: { greater_than_or_equal_to: 0 }

  # Any JWT already issued stays valid until it expires (1 day) unless the jti
  # it carries stops matching. Changing the password must therefore revoke
  # outstanding tokens — otherwise a stolen token keeps working for a whole day
  # after the victim (or an admin, via the reset-password action) reacts to the
  # compromise. As a callback rather than three controller calls so no future
  # password-changing path can forget it.
  after_update :revoke_tokens!, if: :saved_change_to_encrypted_password?

  def vip?        = vip_level.to_i > 0
  def vip_active? = vip? && (vip_expires_at.nil? || vip_expires_at > Time.current)

  # Admin panel and the admin session guard both mean "can use /admin".
  def admin_access? = admin? && !blocked?

  # Call on first review of the day to maintain streak.
  # Idempotent: safe to call multiple times in one day.
  def record_study_session!
    today = Date.current
    return if last_studied_at&.to_date == today

    yesterday   = today - 1
    new_streak  = last_studied_at&.to_date == yesterday ? streak_count + 1 : 1
    update_columns(streak_count: new_streak, last_studied_at: Time.current)
  end

  # Invalidate every JWT already issued to this user, by rotating the jti the
  # JTIMatcher revocation strategy checks against. Sign-out and the admin's
  # block action call it directly; the password callback above goes through it
  # too, so "how a token is revoked" is decided in exactly one place.
  #
  # update_column, not update!, so this never re-enters the callback chain.
  def revoke_tokens!
    update_column(:jti, self.class.generate_jti)
  end
end
