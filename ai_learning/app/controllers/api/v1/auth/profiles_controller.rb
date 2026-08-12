# frozen_string_literal: true

module Api
  module V1
    module Auth
      class ProfilesController < Api::V1::BaseController
        # GET /api/v1/auth/me
        def show
          render json: { data: user_attributes(current_user) }, status: :ok
        end

        # PATCH /api/v1/auth/me
        def update
          allowed = params.require(:user).permit(:name, :jlpt_level)
          if current_user.update(allowed)
            render json: { data: user_attributes(current_user) }, status: :ok
          else
            render_unprocessable(current_user.errors.full_messages)
          end
        end
      end
    end
  end
end
