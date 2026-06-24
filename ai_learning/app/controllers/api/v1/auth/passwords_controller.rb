# frozen_string_literal: true

module Api
  module V1
    module Auth
      class PasswordsController < Api::V1::BaseController
        # PATCH /api/v1/auth/password
        # Body: { current_password:, new_password: }
        def update
          unless current_user.valid_password?(params[:current_password].to_s)
            return render json: { error: "Mật khẩu hiện tại không đúng." }, status: :unprocessable_entity
          end

          if current_user.update(password: params[:new_password].to_s)
            render json: { message: "Đổi mật khẩu thành công." }, status: :ok
          else
            render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
