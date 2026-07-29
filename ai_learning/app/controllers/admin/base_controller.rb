# frozen_string_literal: true

module Admin
  class BaseController < ActionController::Base
    protect_from_forgery with: :exception

    before_action :require_admin_login!

    layout "admin"

    helper_method :current_admin

    private

    def current_admin
      @current_admin ||= User.find_by(id: session[:admin_user_id])
    end

    def require_admin_login!
      unless current_admin&.admin_access?
        session.delete(:admin_user_id)
        redirect_to admin_login_path, alert: "Vui lòng đăng nhập với tài khoản admin."
      end
    end
  end
end
