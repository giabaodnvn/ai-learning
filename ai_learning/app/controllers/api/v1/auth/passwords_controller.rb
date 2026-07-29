# frozen_string_literal: true

module Api
  module V1
    module Auth
      class PasswordsController < Api::V1::BaseController
        # PATCH /api/v1/auth/password
        # Body: { current_password:, new_password: }
        def update
          unless current_user.valid_password?(params[:current_password].to_s)
            return render_unprocessable("Mật khẩu hiện tại không đúng.")
          end

          if current_user.update(password: params[:new_password].to_s)
            render json: { message: "Đổi mật khẩu thành công." }, status: :ok
          else
            render_unprocessable(current_user.errors.full_messages)
          end
        end
      end
    end
  end
end
