# frozen_string_literal: true

module Api
  module V1
    module Concerns
      # Centralises the HTTP mapping for AI-service failures on non-streaming
      # (REST) actions. Previously every AI controller repeated the same three
      # rescue clauses — with drifting status codes and messages. Streaming
      # actions do NOT go through here: they handle these errors inside
      # `SseStreamable#stream_sse` (the response is already committed, so an
      # SSE error event is emitted instead of an HTTP status).
      #
      # The JSON extraction that feeds this path lives in AiJson.
      module AiErrorHandling
        extend ActiveSupport::Concern

        included do
          rescue_from ClaudeService::RateLimitError, with: :render_ai_rate_limit
          rescue_from ClaudeService::TimeoutError,   with: :render_ai_timeout
          rescue_from ClaudeService::ServiceError,   with: :render_ai_unavailable
        end

        private

        # Persist a record whose attributes came from an LLM. The model
        # validations are the only thing standing between syntactically valid
        # JSON with missing/blank fields and a 500; re-raise as a ServiceError so
        # the failure lands on the AI-error path (503, or an SSE error event).
        def create_from_ai!(subject)
          yield
        rescue ActiveRecord::RecordInvalid => e
          raise ClaudeService::ServiceError, "AI returned incomplete #{subject}: #{e.message}"
        end

        def render_ai_rate_limit(_error)
          render json: { error: "Đã đạt giới hạn yêu cầu AI. Vui lòng thử lại sau." },
                 status: :too_many_requests
        end

        def render_ai_timeout(_error)
          render json: { error: "AI phản hồi quá lâu. Vui lòng thử lại." },
                 status: :gateway_timeout
        end

        def render_ai_unavailable(error)
          Rails.logger.error "[AI] service unavailable: #{error.message}"
          render json: { error: "Lỗi kết nối AI. Vui lòng thử lại." },
                 status: :service_unavailable
        end
      end
    end
  end
end
