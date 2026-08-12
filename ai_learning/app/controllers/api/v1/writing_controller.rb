# frozen_string_literal: true

module Api
  module V1
    class WritingController < BaseController
      include Api::V1::Concerns::SseStreamable

      # POST /api/v1/writing/feedback
      # body: { text: "...", topic?: "..." }
      # Streams AI feedback via SSE, then persists the submission.
      def feedback
        text  = params.require(:text).to_s.strip
        topic = params[:topic].presence

        if text.blank?
          return render_unprocessable("Vui lòng nhập bài viết.")
        end

        if text.length > 2000
          return render_unprocessable("Bài viết quá dài (tối đa 2000 ký tự).")
        end

        prompt = Prompts::WritingFeedbackPrompt.build(
          text:       text,
          user_level: current_user.jlpt_level,
          topic:      topic
        )

        full_feedback = +""

        stream_sse do |stream|
          ClaudeService.chat(
            messages:   [ { role: "user", content: prompt } ],
            max_tokens: 1500,
            log_usage:  ai_usage("writing_feedback")
          ) do |delta|
            full_feedback << delta
            write_sse(stream, delta: delta)
          end

          submission = current_user.writing_submissions.create!(
            text:     text,
            feedback: full_feedback,
            topic:    topic
          )

          write_sse(stream, delta: "", done: true, extra: { submission_id: submission.id })
        end
      end

      # GET /api/v1/writing/history
      # Returns the 20 most recent submissions for the current user.
      def history
        submissions = current_user.writing_submissions
                                  .order(created_at: :desc)
                                  .limit(20)
                                  .select(:id, :text, :feedback, :topic, :created_at)

        render json: submissions.map { |s|
          {
            id:          s.id,
            topic:       s.topic,
            text:        s.text,
            feedback:    s.feedback,
            created_at:  s.created_at
          }
        }
      end
    end
  end
end
