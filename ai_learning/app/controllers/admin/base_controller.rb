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
      unless current_admin&.admin? && !current_admin&.blocked?
        session.delete(:admin_user_id)
        redirect_to admin_login_path, alert: "Vui lòng đăng nhập với tài khoản admin."
      end
    end

    def set_flash_and_redirect(path, notice: nil, alert: nil)
      flash[:notice] = notice if notice
      flash[:alert]  = alert  if alert
      redirect_to path
    end
  end
end
