# frozen_string_literal: true

class UserMailer < ApplicationMailer
  # Sent when an admin resets a user's password. Delivers the new temporary
  # password so the user can sign in and then change it themselves.
  def password_reset_by_admin(user, temp_password)
    @user          = user
    @temp_password = temp_password
    mail(to: user.email, subject: "🔑 Mật khẩu tài khoản của bạn đã được đặt lại")
  end
end
