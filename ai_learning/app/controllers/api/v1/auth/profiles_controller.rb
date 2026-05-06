# frozen_string_literal: true

module Api
  module V1
    module Auth
      class ProfilesController < Api::V1::BaseController
        # GET /api/v1/auth/me
        def show
          render json: {
            data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
          }, status: :ok
        end

        # PATCH /api/v1/auth/me
        def update
          allowed = params.require(:user).permit(:name, :jlpt_level)
          if current_user.update(allowed)
            render json: {
              data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
            }, status: :ok
          else
            render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
