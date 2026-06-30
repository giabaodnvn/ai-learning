# frozen_string_literal: true

module Api
  module V1
    class KanjisController < BaseController
      include Api::V1::Concerns::Paginatable

      # GET /api/v1/kanjis?level=n3&page=1&per_page=30
      def index
        level = params[:level].presence&.downcase
        scope = level ? Kanji.by_level(level) : Kanji.all

        kanjis, meta = paginate(scope, order: :id, default_per: 30, max_per: 50)

        render json: {
          data: KanjiSerializer.new(kanjis).serializable_hash[:data],
          meta: meta
        }
      end

      # GET /api/v1/kanjis/:id
      def show
        kanji = Kanji.find(params[:id])
        render json: KanjiSerializer.new(kanji).serializable_hash
      rescue ActiveRecord::RecordNotFound
        render_not_found("Kanji")
      end
    end
  end
end
