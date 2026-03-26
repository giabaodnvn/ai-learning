# frozen_string_literal: true

module Api
  module V1
    class ConversationController < BaseController
      include Api::V1::Concerns::SseStreamable

      # POST /api/v1/conversation/chat
      def chat
        role       = params[:role].presence || "free_talk"
        user_level = params[:user_level].presence || current_user.jlpt_level
        messages   = Array(params[:messages]).map do |m|
          { role: m[:role], content: m[:content] }
        end

        system_prompt = Prompts::ConversationTutorPrompt.build(
          role:       role,
          user_level: user_level,
          history:    messages[0..-2] # exclude last user message
        )

        stream_sse do |stream|
          ClaudeService.chat(
            messages:   messages,
            system:     system_prompt,
            model:      ClaudeService::CONVERSATION_MODEL
          ) do |delta|
            write_sse(stream, delta: delta)
          end
          write_sse(stream, delta: "", done: true)
        end
      end
    end
  end
end
