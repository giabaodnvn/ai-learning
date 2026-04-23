# frozen_string_literal: true

module Api
  module V1
    class KanjisController < BaseController
      # GET /api/v1/kanjis?level=n3&page=1&per_page=30
      def index
        level   = params[:level].presence&.downcase
        page    = [(params[:page].presence || 1).to_i, 1].max
        per     = [[(params[:per_page].presence || 30).to_i, 1].max, 50].min

        scope  = level ? Kanji.by_level(level) : Kanji.all
        total  = scope.count
        kanjis = scope.order(:id).offset((page - 1) * per).limit(per)

        render json: {
          data: KanjiSerializer.new(kanjis).serializable_hash[:data],
          meta: { total: total, page: page, per_page: per, pages: (total.to_f / per).ceil }
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
