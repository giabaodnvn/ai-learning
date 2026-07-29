# frozen_string_literal: true

module Api
  module V1
    module Concerns
      module SseStreamable
        extend ActiveSupport::Concern

        # Failure → the `error` code the client receives, and how loudly to log.
        # Order matters: the first matching class wins.
        ERROR_CODES = [
          [ ClaudeService::RateLimitError, "rate_limit",   :warn  ],
          [ ClaudeService::TimeoutError,   "timeout",      :warn  ],
          [ ClaudeService::ServiceError,   "server_error", :error ]
        ].freeze

        # Anything else raised after streaming started (a failed create!, a
        # Redis outage): the response is already committed so no status can be
        # sent, only a terminal error event.
        FALLBACK_ERROR = [ nil, "server_error", :error ].freeze

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
        rescue => e
          emit_stream_error(e)
        ensure
          response.stream.close
        end

        # Tell the client the stream is over and why, so it stops waiting
        # instead of seeing a silently truncated response.
        def emit_stream_error(error)
          _klass, code, level = ERROR_CODES.find { |klass, _, _| error.is_a?(klass) } || FALLBACK_ERROR

          begin
            write_sse(response.stream, delta: "", done: true, error: code)
          rescue StandardError
            # The socket is already gone; the log below is all we can do.
          end

          Rails.logger.public_send(level, "[SSE] #{error.class}: #{error.message}")
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

        # Write a single SSE event with the plain-text streaming shape.
        # Format: data: {"delta":"...","done":false}\n\n
        def write_sse(stream, delta:, done: false, error: nil, extra: nil)
          payload = { delta: delta, done: done }
          payload[:error] = error if error
          payload.merge!(extra) if extra.is_a?(Hash)
          write_event(stream, payload)
        end

        # Write an arbitrary JSON payload as one SSE event. Used by endpoints
        # that speak a typed protocol ({type: "delta"|"correction"|"done"})
        # rather than the delta/done shape above.
        def write_event(stream, payload)
          stream.write("data: #{payload.to_json}\n\n")
        end
      end
    end
  end
end
