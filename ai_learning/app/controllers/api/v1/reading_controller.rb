# frozen_string_literal: true

module Api
  module V1
    class ReadingController < BaseController
      # POST /api/v1/reading/generate
      def generate
        prompt = Prompts::ReadingGeneratorPrompt.build(
          topic:      params.require(:topic),
          jlpt_level: level_param_or_user(:jlpt_level)
        )

        # Cached, unlike reading_passages#generate: this endpoint returns the
        # passage without persisting it, so the cache is the only reuse.
        raw = AiCacheService.fetch(prompt) do
          ClaudeService.complete(
            prompt:     prompt,
            max_tokens: 4096,
            log_usage:  { feature: "reading_generate", user_id: current_user.id }
          )
        end

        render json: AiJson.parse(raw), status: :ok
      end
    end
  end
end
