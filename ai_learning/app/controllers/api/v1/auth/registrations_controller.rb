# frozen_string_literal: true

module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        respond_to :json

        # POST /api/v1/auth/sign_up
        def create
          build_resource(sign_up_params)

          if resource.save
            token, _payload = Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil)
            response.set_header("Authorization", "Bearer #{token}")

            render json: { message: "Account created successfully.", data: user_attributes(resource) },
                   status: :created
          else
            render_unprocessable(resource.errors.full_messages)
          end
        end

        private

        def sign_up_params
          params.require(:user).permit(:name, :email, :password, :password_confirmation)
        end
      end
    end
  end
end
