# frozen_string_literal: true

module Api
  module V1
    module Concerns
      # Shared list pagination for index actions.
      # Reads `page`/`per_page` params, clamps `per` to [1, max_per], applies
      # `order`, and returns the paginated records plus a meta hash for the JSON
      # response.
      module Paginatable
        extend ActiveSupport::Concern

        private

        def paginate(scope, order:, default_per:, max_per:)
          page = [ (params[:page].presence || 1).to_i, 1 ].max
          per  = [ [ (params[:per_page].presence || default_per).to_i, 1 ].max, max_per ].min

          total   = scope.count
          records = scope.order(order).offset((page - 1) * per).limit(per)
          meta    = { total: total, page: page, per_page: per, pages: (total.to_f / per).ceil }

          [ records, meta ]
        end

        # Paginate `scope`, serialize with `serializer`, and render the standard
        # `{ data:, meta: }` list response. Collapses the identical index-action
        # boilerplate across the vocabulary/kanji/grammar list endpoints.
        def render_paginated(scope, serializer:, order:, default_per:, max_per:)
          records, meta = paginate(scope, order: order, default_per: default_per, max_per: max_per)
          render json: {
            data: serializer.new(records).serializable_hash[:data],
            meta: meta
          }
        end
      end
    end
  end
end
