# frozen_string_literal: true

module Api
  module V1
    module Concerns
      # The two on-demand content types — reading passages and listening
      # exercises — expose the same two behaviours through different controllers:
      #
      #   * an index that lists what has been generated for a level and seeds the
      #     level with one fresh item when it is still empty, and
      #   * a multiple-choice answer check whose response body (including the
      #     Vietnamese feedback strings) is byte-identical between them.
      #
      # Both were written out twice, and the answer keys had already drifted
      # ("answer_index" for passages, "correct_index" for exercises), so the two
      # copies could not be diffed at a glance. The model-side half of this
      # pairing lives in the AiGeneratedContent concern.
      #
      # Including controllers must define `generate_and_save!(jlpt_level:, topic:)`.
      module GeneratedContent
        extend ActiveSupport::Concern

        private

        # The newest items at the requested level (optionally one topic), never
        # empty: a level with nothing generated yet gets one item made for it so
        # the screen has something on it the first time it is opened.
        def listed_content(model, default_topic:)
          level = level_param_or_user
          topic = params[:topic].presence

          items = model.recent_for(level, topic).to_a
          items.presence || [ generate_and_save!(jlpt_level: level, topic: topic || default_topic) ]
        end

        # Grade one answer against a question hash. `answer_key` names the field
        # holding the correct option's index, which differs per content type.
        # Returns nil when the question index is out of range, so the caller can
        # 404 rather than grade against a missing question.
        def graded_answer(question, answer_index, answer_key:)
          return nil unless question

          correct_index  = question[answer_key].to_i
          correct        = correct_index == answer_index
          correct_option = Array(question["options"])[correct_index]

          {
            correct:        correct,
            correct_index:  correct_index,
            explanation_vi: correct ? "Chính xác! 🎉" : "Đáp án đúng là: #{correct_option}"
          }
        end

        def render_question_not_found
          render json: { error: "Câu hỏi không tồn tại" }, status: :not_found
        end

        # The JSON envelope both content types return. Seven of the nine keys
        # were identical between the two hand-written serializers; `extra`
        # carries the body fields that differ (content + highlights for a
        # passage, the two scripts for an exercise).
        def content_json(record, **extra)
          {
            id:           record.id,
            title:        record.title,
            jlpt_level:   record.jlpt_level,
            topic:        record.topic,
            questions:    record.questions,
            ai_generated: record.ai_generated,
            created_at:   record.created_at
          }.merge(extra)
        end
      end
    end
  end
end
