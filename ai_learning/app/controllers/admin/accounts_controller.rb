# frozen_string_literal: true

module Admin
  class AccountsController < Admin::BaseController
    # GET /admin/account/edit
    def edit; end

    # PATCH /admin/account
    def update
      unless current_admin.valid_password?(params[:current_password].to_s)
        flash.now[:alert] = "Mật khẩu hiện tại không đúng."
        return render :edit, status: :unprocessable_content
      end

      if current_admin.update(password: params[:new_password].to_s)
        redirect_to edit_admin_account_path, notice: "Đổi mật khẩu thành công."
      else
        flash.now[:alert] = current_admin.errors.full_messages.to_sentence
        render :edit, status: :unprocessable_content
      end
    end
  end
end
