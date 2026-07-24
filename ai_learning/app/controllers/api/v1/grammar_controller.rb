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
          ClaudeService.complete(
            prompt:    prompt,
            log_usage: { feature: "grammar_check", user_id: current_user.id }
          )
        end

        result = parse_ai_json(raw)
        render json: result, status: :ok
      end
    end
  end
end
