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
          ClaudeService.complete(
            prompt:     prompt,
            max_tokens: 4096,
            log_usage:  { feature: "reading_generate", user_id: current_user.id }
          )
        end

        result = parse_ai_json(raw)
        render json: result, status: :ok
      end
    end
  end
end
