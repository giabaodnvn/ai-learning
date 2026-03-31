# frozen_string_literal: true

module Admin
  class SessionsController < ActionController::Base
    protect_from_forgery with: :exception
    layout "admin"
    include AdminHelper

    def new
      redirect_to admin_root_path if logged_in?
    end

    def create
      user = User.find_by(email: params[:email].to_s.strip.downcase)

      if user&.valid_password?(params[:password]) && user.admin? && !user.blocked?
        session[:admin_user_id] = user.id
        redirect_to admin_root_path, notice: "Đăng nhập thành công. Chào #{user.name || user.email}!"
      else
        flash.now[:alert] = "Email hoặc mật khẩu không đúng, hoặc tài khoản không có quyền admin."
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      session.delete(:admin_user_id)
      redirect_to admin_login_path, notice: "Đã đăng xuất."
    end

    private

    def logged_in?
      user = User.find_by(id: session[:admin_user_id])
      user&.admin? && !user&.blocked?
    end
  end
end
