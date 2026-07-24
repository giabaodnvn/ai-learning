# frozen_string_literal: true

module Api
  module V1
    module Concerns
      module SseStreamable
        extend ActiveSupport::Concern

        included do
          include ActionController::Live
        end

        # Wrap an action in SSE headers and ensure the stream is closed.
        # Yields the response stream so the caller can write events.
        #
        # Example usage in a controller action:
        #
        #   def create
        #     stream_sse do |stream|
        #       ClaudeService.chat(messages: ...) do |delta|
        #         write_sse(stream, delta: delta)
        #       end
        #       write_sse(stream, delta: "", done: true)
        #     end
        #   end
        def stream_sse
          response.headers["Content-Type"]      = "text/event-stream"
          response.headers["Cache-Control"]     = "no-cache"
          response.headers["X-Accel-Buffering"] = "no"
          response.headers["Connection"]        = "keep-alive"

          yield response.stream
        rescue ActionController::Live::ClientDisconnected
          # Client navigated away — normal, not an error
        rescue ClaudeService::RateLimitError => e
          response.stream.write("data: #{({ delta: '', done: true, error: 'rate_limit' }).to_json}\n\n") rescue nil
          Rails.logger.warn "[SSE] Rate limit: #{e.message}"
        rescue ClaudeService::TimeoutError => e
          response.stream.write("data: #{({ delta: '', done: true, error: 'timeout' }).to_json}\n\n") rescue nil
          Rails.logger.warn "[SSE] Timeout: #{e.message}"
        rescue ClaudeService::ServiceError => e
          response.stream.write("data: #{({ delta: '', done: true, error: 'server_error' }).to_json}\n\n") rescue nil
          Rails.logger.error "[SSE] Service error: #{e.message}"
        rescue => e
          # A non-AI error raised after streaming started (e.g. a failed DB
          # create!, a Redis outage). The response is already committed, so we
          # cannot render an error status — emit a terminal error event instead
          # so the client stops waiting rather than silently truncating.
          response.stream.write("data: #{({ delta: '', done: true, error: 'server_error' }).to_json}\n\n") rescue nil
          Rails.logger.error "[SSE] Unexpected #{e.class}: #{e.message}"
        ensure
          response.stream.close
        end

        # Stream a plain-text AI reply: forward each delta as an SSE event, then
        # emit the terminal done event. `chat_kwargs` are passed straight to
        # ClaudeService.chat (messages:, system:, model:, log_usage:, ...).
        def stream_ai_reply(stream, **chat_kwargs)
          ClaudeService.chat(**chat_kwargs) do |delta|
            write_sse(stream, delta: delta)
          end
          write_sse(stream, delta: "", done: true)
        end

        # Write a single SSE event.
        # Format: data: {"delta":"...","done":false}\n\n
        def write_sse(stream, delta:, done: false, error: nil, extra: nil)
          payload = { delta: delta, done: done }
          payload[:error] = error if error
          payload.merge!(extra) if extra.is_a?(Hash)
          stream.write("data: #{payload.to_json}\n\n")
        end
      end
    end
  end
end
