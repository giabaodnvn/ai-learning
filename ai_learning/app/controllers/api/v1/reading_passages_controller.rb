# frozen_string_literal: true

module Api
  module V1
    class ReadingPassagesController < BaseController
      include Api::V1::Concerns::GeneratedContent

      self.not_found_label = "Bài đọc"

      # GET /api/v1/reading_passages?level=n5&topic=daily_life
      # Returns cached DB passages first; generates one if none exist.
      DEFAULT_TOPIC = "日常生活"

      def index
        passages = listed_content(ReadingPassage, default_topic: DEFAULT_TOPIC)

        render json: passages.map { |p| serialize_passage(p) }
      end

      # POST /api/v1/reading_passages/generate
      # body: { jlpt_level, topic }
      def generate
        topic      = params.require(:topic)
        jlpt_level = level_param_or_user(:jlpt_level)

        passage = generate_and_save!(jlpt_level: jlpt_level, topic: topic)
        render json: serialize_passage(passage), status: :created
      end

      # POST /api/v1/reading_passages/:id/answer
      # body: { question_index, answer_index }
      def answer
        passage        = ReadingPassage.find(params[:id])
        question_index = params.require(:question_index).to_i
        answer_index   = params.require(:answer_index).to_i

        result = graded_answer(passage.questions[question_index], answer_index, answer_key: "answer_index")
        return render_question_not_found unless result

        render json: result
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
          prompt    = Prompts::WordLookupPrompt.build(word: word)
          log_usage = ai_usage("reading_word_lookup")
          # Cached: the same word is looked up by many readers.
          raw       = AiCacheService.fetch(prompt, log_usage: log_usage) do
            ClaudeService.complete(prompt: prompt, max_tokens: 512, log_usage: log_usage)
          end

          render json: AiJson.parse(raw)
        end
      end

      private

      def generate_and_save!(jlpt_level:, topic:)
        data = AiJson.complete(
          prompt:     Prompts::ReadingGeneratorPrompt.build(topic: topic, jlpt_level: jlpt_level),
          feature:    "reading_generate",
          user_id:    current_user.id,
          max_tokens: 4096
        )

        create_from_ai!("passage data") do
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
      end

      def serialize_passage(passage)
        content_json(
          passage,
          content:               passage.content,
          vocabulary_highlights: passage.vocabulary_highlights
        )
      end
    end
  end
end
