module Api
  module V1
    class BaseController < ApplicationController
      include Api::V1::Concerns::AiErrorHandling
      include Api::V1::Concerns::LevelScoped

      # Label used in the 404 message. Subclasses that deal with a single
      # resource type override it (e.g. `self.not_found_label = "Bài đọc"`),
      # so the per-action `rescue ActiveRecord::RecordNotFound` blocks that used
      # to be copy-pasted across every controller are no longer needed.
      class_attribute :not_found_label, default: "Resource", instance_writer: false

      before_action :authenticate_from_jwt!

      rescue_from ActiveRecord::RecordNotFound, with: :render_record_not_found

      private

      def render_record_not_found
        render_not_found(self.class.not_found_label)
      end

      def authenticate_from_jwt!
        token = request.headers["Authorization"]&.split(" ")&.last
        return render_unauthorized unless token

        payload = JwtDecoder.decode(token)

        @current_user = User.find(payload["sub"])

        # JTIMatcher revocation check
        return render_unauthorized if @current_user.jti != payload["jti"]

        # Blocked accounts lose API access immediately
        render_forbidden("Tài khoản đã bị khóa.") if @current_user.blocked?
      rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
        render_unauthorized
      end

      def current_user
        @current_user
      end

      def redis
        AppRedis.current
      end
    end
  end
end
