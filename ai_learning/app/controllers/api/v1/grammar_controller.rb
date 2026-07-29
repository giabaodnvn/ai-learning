# frozen_string_literal: true

module Api
  module V1
    class GrammarController < BaseController
      # POST /api/v1/grammar/check
      def check
        result = AiJson.complete(
          prompt: Prompts::GrammarCheckerPrompt.build(
            sentence:       params.require(:sentence),
            target_grammar: params[:target_grammar].presence || "",
            user_level:     level_param_or_user(:user_level)
          ),
          feature: "grammar_check",
          user_id: current_user.id
        )

        render json: result, status: :ok
      end
    end
  end
end
