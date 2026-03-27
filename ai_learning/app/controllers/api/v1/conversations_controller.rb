# frozen_string_literal: true

module Api
  module V1
    class ConversationsController < BaseController
      include Api::V1::Concerns::SseStreamable

      # GET /api/v1/conversations
      # Returns the 20 most-recently-updated sessions for the current user.
      def index
        sessions = current_user.conversation_sessions.recent.limit(20)
        render json: sessions.map { |s| session_summary(s) }
      end

      # POST /api/v1/conversations
      # body: { role, jlpt_level? }
      # Creates a new session and seeds it with the AI opening message.
      def create
        role  = params.require(:role).to_s
        level = params[:jlpt_level].presence&.downcase || current_user.jlpt_level

        unless Prompts::ConversationTutorPrompt::ROLES.include?(role)
          return render json: { error: "role không hợp lệ" }, status: :unprocessable_entity
        end
        unless ConversationSession::JLPT_LEVELS.include?(level)
          return render json: { error: "jlpt_level không hợp lệ" }, status: :unprocessable_entity
        end

        session = current_user.conversation_sessions.create!(role: role, jlpt_level: level)

        opening = Prompts::ConversationTutorPrompt::OPENINGS[role]
        session.add_message(role: "assistant", content: opening)

        render json: session_detail(session), status: :created
      end

      # GET /api/v1/conversations/:id
      def show
        session = find_session
        render json: session_detail(session)
      end

      # POST /api/v1/conversations/:id/send_message  (SSE)
      # body: { content: "user's Japanese message" }
      # Streams the AI reply as typed SSE events, then persists both messages.
      def send_message
        session      = find_session
        user_content = params.require(:content).to_s.strip

        if user_content.blank?
          return render json: { error: "Message không được rỗng" }, status: :unprocessable_entity
        end

        session.add_message(role: "user", content: user_content)

        # Build message history for the AI (role + content only)
        ai_messages = session.messages.map { |m| { role: m["role"], content: m["content"] } }
        system_prompt = Prompts::ConversationTutorPrompt.build(
          role:       session.role,
          user_level: session.jlpt_level
        )

        full_response = +""

        stream_sse do |stream|
          ClaudeService.chat(
            messages:   ai_messages,
            system:     system_prompt,
            model:      ClaudeService::CONVERSATION_MODEL
          ) do |delta|
            full_response << delta
            stream.write("data: #{({ type: "delta", content: delta }).to_json}\n\n")
          end

          parsed = Prompts::ConversationTutorPrompt.parse_response(full_response)

          session.add_message(
            role:           "assistant",
            content:        parsed[:content],
            corrections:    parsed[:corrections].presence,
            new_words:      parsed[:new_words].presence,
            translation_vi: parsed[:translation_vi]
          )

          stream.write("data: #{({ type: "correction",
                                    content:        parsed[:content],
                                    corrections:    parsed[:corrections],
                                    new_words:      parsed[:new_words],
                                    translation_vi: parsed[:translation_vi] }).to_json}\n\n")
          stream.write("data: #{({ type: "done" }).to_json}\n\n")
        end
      end

      # DELETE /api/v1/conversations/:id
      def destroy
        find_session.destroy!
        head :no_content
      end

      private

      def find_session
        current_user.conversation_sessions.find(params[:id])
      end

      def session_summary(s)
        cfg      = Prompts::ConversationTutorPrompt::ROLE_CONFIGS[s.role] || {}
        last_msg = s.messages.select { |m| m["role"] == "user" }.last
        {
          id:              s.id,
          role:            s.role,
          role_name_vi:    cfg[:name_vi],
          role_icon:       cfg[:icon],
          jlpt_level:      s.jlpt_level,
          message_count:   s.messages.size,
          last_message_at: s.updated_at,
          preview:         last_msg&.dig("content")&.truncate(80)
        }
      end

      def session_detail(s)
        cfg = Prompts::ConversationTutorPrompt::ROLE_CONFIGS[s.role] || {}
        {
          id:           s.id,
          role:         s.role,
          role_name_vi: cfg[:name_vi],
          role_icon:    cfg[:icon],
          jlpt_level:   s.jlpt_level,
          messages:     s.messages,
          created_at:   s.created_at,
          updated_at:   s.updated_at
        }
      end
    end
  end
end
