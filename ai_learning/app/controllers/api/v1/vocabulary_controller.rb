# frozen_string_literal: true

module Api
  module V1
    class VocabularyController < BaseController
      include Api::V1::Concerns::SseStreamable
      include Api::V1::Concerns::Paginatable

      self.not_found_label = "Vocabulary"

      # GET /api/v1/vocabularies?level=n5&page=1&per_page=30&search=たべる
      def index
        search = params[:search].presence

        scope = Vocabulary.by_level(level_param)
        if search
          like = "%#{ActiveRecord::Base.sanitize_sql_like(search)}%"
          scope = scope.where("word LIKE ? OR reading LIKE ? OR meaning_vi LIKE ?", like, like, like)
        end

        render_paginated(scope, serializer: VocabularySerializer, order: :word, default_per: 30, max_per: 100)
      end

      # POST /api/v1/vocabulary/explain
      def explain
        word    = params.require(:word)
        reading = params[:reading].presence || word

        stream_vocab_explanation(
          word: word, reading: reading, user_level: valid_level_or_user(:user_level)
        )
      end

      # GET /api/v1/vocabularies/:id/explain
      # Looks up vocabulary by ID and streams an SSE explanation.
      # user_level is taken from current_user — no extra param needed.
      def explain_by_id
        vocabulary = Vocabulary.find(params[:id])
        stream_vocab_explanation(
          word:       vocabulary.word,
          reading:    vocabulary.reading,
          user_level: current_user.jlpt_level
        )
      end

      private

      # Stream a vocabulary explanation over SSE, serving a cached result when
      # present and otherwise caching the freshly streamed text.
      def stream_vocab_explanation(word:, reading:, user_level:)
        prompt = Prompts::VocabExplainerPrompt.build(
          word: word, reading: reading, user_level: user_level
        )

        stream_sse do |stream|
          AiCacheService.stream(
            prompt,
            log_usage: { feature: "vocabulary_explain", user_id: current_user.id }
          ) { |delta| write_sse(stream, delta: delta) }

          write_sse(stream, delta: "", done: true)
        end
      end
    end
  end
end
