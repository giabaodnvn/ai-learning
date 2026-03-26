# frozen_string_literal: true

module Api
  module V1
    class ReadingController < BaseController

      # POST /api/v1/reading/generate
      def generate
        topic      = params.require(:topic)
        jlpt_level = params[:jlpt_level].presence || current_user.jlpt_level

        prompt = Prompts::ReadingGeneratorPrompt.build(
          topic:      topic,
          jlpt_level: jlpt_level
        )

        raw = AiCacheService.fetch(prompt) do
          ClaudeService.complete(prompt: prompt, max_tokens: 4096)
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
