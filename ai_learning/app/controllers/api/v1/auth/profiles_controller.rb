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
      end
    end
  end
end
