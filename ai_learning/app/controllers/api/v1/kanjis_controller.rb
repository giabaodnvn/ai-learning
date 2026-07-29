# frozen_string_literal: true

module Api
  module V1
    class KanjisController < BaseController
      include Api::V1::Concerns::Paginatable

      self.not_found_label = "Kanji"

      # GET /api/v1/kanjis?level=n3&page=1&per_page=30
      def index
        render_paginated(Kanji.by_level(level_param), serializer: KanjiSerializer,
                         order: :id, default_per: 30, max_per: 50)
      end

      # GET /api/v1/kanjis/:id
      def show
        kanji = Kanji.find(params[:id])
        render json: KanjiSerializer.new(kanji).serializable_hash
      end
    end
  end
end
