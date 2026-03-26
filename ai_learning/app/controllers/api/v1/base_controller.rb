module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_from_jwt!

      private

      def authenticate_from_jwt!
        token = request.headers["Authorization"]&.split(" ")&.last
        return render_unauthorized unless token

        payload = JWT.decode(
          token,
          ENV.fetch("DEVISE_JWT_SECRET_KEY"),
          true,
          algorithms: [ "HS256" ]
        ).first

        @current_user = User.find(payload["sub"])

        # JTIMatcher revocation check
        return render_unauthorized if @current_user.jti != payload["jti"]
      rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
        render_unauthorized
      end

      def current_user
        @current_user
      end
    end
  end
end
