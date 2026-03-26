# frozen_string_literal: true

module Api
  module V1
    class GrammarController < BaseController

      # POST /api/v1/grammar/check
      def check
        sentence       = params.require(:sentence)
        target_grammar = params[:target_grammar].presence || ""
        user_level     = params[:user_level].presence || current_user.jlpt_level

        prompt = Prompts::GrammarCheckerPrompt.build(
          sentence:       sentence,
          target_grammar: target_grammar,
          user_level:     user_level
        )

        raw = AiCacheService.fetch(prompt, skip_cache: true) do
          ClaudeService.complete(prompt: prompt)
        end

        result = parse_ai_json(raw)
        render json: result, status: :ok
      rescue JSON::ParserError
        render json: { error: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại." },
               status: :unprocessable_entity
      rescue ClaudeService::RateLimitError
        render json: { error: "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau." },
               status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "AI phản hồi quá lâu. Vui lòng thử lại." },
               status: :gateway_timeout
      rescue ClaudeService::ServiceError
        render json: { error: "Lỗi kết nối AI. Vui lòng thử lại." },
               status: :service_unavailable
      end
    end
  end
end
