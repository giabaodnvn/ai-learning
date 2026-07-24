module Api
  module V1
    class BaseController < ApplicationController
      include Api::V1::Concerns::AiErrorHandling

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
        @redis ||= Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
      end

      # Gemini often wraps JSON in markdown code fences or adds preamble text.
      # Try multiple strategies to extract valid JSON.
      def parse_ai_json(raw)
        text = raw.to_s

        # Strategy 1: extract from ```json ... ``` or ``` ... ```
        if (m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i))
          return JSON.parse(m[1].strip)
        end

        # Strategy 2: find outermost { ... } block
        start  = text.index("{")
        finish = text.rindex("}")
        return JSON.parse(text[start..finish]) if start && finish

        # Strategy 3: parse as-is
        JSON.parse(text.strip)
      rescue JSON::ParserError => e
        # Malformed LLM output — surface as a ServiceError so controllers reuse
        # their existing ClaudeService::ServiceError rescue (503) instead of 500.
        raise ClaudeService::ServiceError, "AI returned unparseable JSON: #{e.message}"
      end
    end
  end
end
