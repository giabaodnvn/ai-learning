# frozen_string_literal: true

module Api
  module V1
    class ReadingPassagesController < BaseController

      # GET /api/v1/reading_passages?level=n5&topic=daily_life
      # Returns cached DB passages first; generates one if none exist.
      def index
        level = params[:level].presence || current_user.jlpt_level
        topic = params[:topic].presence

        scope = ReadingPassage.ai_generated.by_level(level)
        scope = scope.by_topic(topic) if topic
        passages = scope.order(created_at: :desc).limit(12)

        if passages.any?
          render json: passages.map { |p| serialize_passage(p) }
        else
          passage = generate_and_save!(
            jlpt_level: level,
            topic:      topic || "日常生活"
          )
          render json: [serialize_passage(passage)]
        end
      rescue ClaudeService::RateLimitError
        render json: { error: "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau." }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "AI phản hồi quá lâu. Vui lòng thử lại." }, status: :gateway_timeout
      rescue ClaudeService::ServiceError
        render json: { error: "Lỗi kết nối AI. Vui lòng thử lại." }, status: :service_unavailable
      end

      # POST /api/v1/reading_passages/generate
      # body: { jlpt_level, topic }
      def generate
        topic      = params.require(:topic)
        jlpt_level = params[:jlpt_level].presence || current_user.jlpt_level

        passage = generate_and_save!(jlpt_level: jlpt_level, topic: topic)
        render json: serialize_passage(passage), status: :created
      rescue JSON::ParserError
        render json: { error: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại." },
               status: :unprocessable_entity
      rescue ClaudeService::RateLimitError
        render json: { error: "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau." }, status: :too_many_requests
      rescue ClaudeService::TimeoutError
        render json: { error: "AI phản hồi quá lâu. Vui lòng thử lại." }, status: :gateway_timeout
      rescue ClaudeService::ServiceError
        render json: { error: "Lỗi kết nối AI. Vui lòng thử lại." }, status: :service_unavailable
      end

      # POST /api/v1/reading_passages/:id/answer
      # body: { question_index, answer_index }
      def answer
        passage        = ReadingPassage.find(params[:id])
        question_index = params.require(:question_index).to_i
        answer_index   = params.require(:answer_index).to_i

        question = passage.questions[question_index]
        return render json: { error: "Câu hỏi không tồn tại" }, status: :not_found unless question

        correct_index  = question["answer_index"].to_i
        correct        = correct_index == answer_index
        correct_option = question["options"][correct_index]

        render json: {
          correct:        correct,
          correct_index:  correct_index,
          explanation_vi: correct ? "Chính xác! 🎉" : "Đáp án đúng là: #{correct_option}"
        }
      rescue ActiveRecord::RecordNotFound
        render_not_found("Bài đọc")
      end

      # GET /api/v1/reading_passages/:id/word_lookup?word=食べる
      def word_lookup
        ReadingPassage.find(params[:id]) # validates passage exists

        word  = params.require(:word)
        vocab = Vocabulary.where(word: word).or(Vocabulary.where(reading: word)).first

        if vocab
          render json: {
            word:       vocab.word,
            reading:    vocab.reading,
            meaning_vi: vocab.meaning_vi,
            example:    "",
            example_vi: ""
          }
        else
          prompt = Prompts::WordLookupPrompt.build(word: word)
          raw    = AiCacheService.fetch(prompt) do
            ClaudeService.complete(prompt: prompt, max_tokens: 512)
          end
          result = parse_ai_json(raw)
          render json: result
        end
      rescue ActiveRecord::RecordNotFound
        render_not_found("Bài đọc")
      rescue JSON::ParserError
        render json: { error: "Không thể tra cứu từ này." }, status: :unprocessable_entity
      rescue ClaudeService::RateLimitError
        render json: { error: "Đã đạt giới hạn yêu cầu AI." }, status: :too_many_requests
      rescue ClaudeService::ServiceError
        render json: { error: "Lỗi kết nối AI." }, status: :service_unavailable
      end

      private

      def generate_and_save!(jlpt_level:, topic:)
        prompt = Prompts::ReadingGeneratorPrompt.build(
          topic:      topic,
          jlpt_level: jlpt_level
        )

        raw  = AiCacheService.fetch(prompt, skip_cache: true) do
          ClaudeService.complete(prompt: prompt, max_tokens: 4096)
        end
        data = parse_ai_json(raw)

        ReadingPassage.create!(
          title:                data["title"],
          content:              data["content"],
          jlpt_level:           jlpt_level,
          topic:                topic,
          questions:            data["questions"]             || [],
          vocabulary_highlights: data["vocabulary_highlights"] || [],
          ai_generated:         true
        )
      end

      def serialize_passage(passage)
        {
          id:                    passage.id,
          title:                 passage.title,
          content:               passage.content,
          jlpt_level:            passage.jlpt_level,
          topic:                 passage.topic,
          questions:             passage.questions,
          vocabulary_highlights: passage.vocabulary_highlights,
          ai_generated:          passage.ai_generated,
          created_at:            passage.created_at
        }
      end
    end
  end
end
