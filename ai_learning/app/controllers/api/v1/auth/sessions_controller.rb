# frozen_string_literal: true

module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        # POST /api/v1/auth/sign_in
        def create
          user = User.find_by(email: params.dig(:user, :email)&.downcase)

          if user&.valid_password?(params.dig(:user, :password))
            token, _payload = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
            response.set_header("Authorization", "Bearer #{token}")

            render json: {
              message: "Logged in successfully.",
              data: UserSerializer.new(user).serializable_hash[:data][:attributes]
            }, status: :ok
          else
            render json: { error: "Invalid email or password." }, status: :unauthorized
          end
        end

        # DELETE /api/v1/auth/sign_out
        def destroy
          token = request.headers["Authorization"]&.split(" ")&.last

          if token
            begin
              payload = JWT.decode(token, ENV.fetch("DEVISE_JWT_SECRET_KEY"), true, algorithms: [ "HS256" ]).first
              user = User.find_by(id: payload["sub"])
              user&.update_column(:jti, SecureRandom.uuid)
              render json: { message: "Logged out successfully." }, status: :ok
            rescue JWT::DecodeError
              render json: { message: "Logged out." }, status: :ok
            end
          else
            render json: { message: "No active session." }, status: :ok
          end
        end
      end
    end
  end
end
