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
      end
    end
  end
end
