# frozen_string_literal: true

require "net/http"
require "json"

# ClaudeService — AI service layer backed by Google Gemini API.
# Interface is intentionally identical to the Claude version so all
# controllers work without modification.
class ClaudeService
  BASE_URL           = "https://generativelanguage.googleapis.com"
  CONVERSATION_MODEL = "gemini-2.5-flash"
  DEFAULT_MODEL      = "gemini-2.5-flash"

  # Streaming chat — yields each text delta as it arrives.
  # `system` is passed as Gemini's systemInstruction (not a user turn).
  def self.chat(messages:, model: CONVERSATION_MODEL, max_tokens: 2048, system: nil, &block)
    body = {
      contents:         gemini_contents(messages),
      generationConfig: { maxOutputTokens: max_tokens, thinkingConfig: { thinkingBudget: 0 } }
    }
    body[:systemInstruction] = { parts: [ { text: system } ] } if system

    uri = URI("#{BASE_URL}/v1beta/models/#{model}:streamGenerateContent?alt=sse&key=#{api_key}")

    Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 60) do |http|
      req      = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
      req.body = body.to_json

      http.request(req) do |res|
        handle_error_status!(res.code.to_i)
        buffer = +""
        res.read_body do |chunk|
          buffer << chunk
          while (line = buffer.slice!(/.*\n/))
            begin
              line.strip!
              next unless line.start_with?("data: ")
              data = line.delete_prefix("data: ")
              next if data == "[DONE]"
              parsed = JSON.parse(data)
              text   = parsed.dig("candidates", 0, "content", "parts", 0, "text")
              block.call(text) if text && block
            rescue JSON::ParserError
              next
            end
          end
        end
      end
    end
  rescue RateLimitError, TimeoutError, ServiceError
    raise
  rescue Net::ReadTimeout
    raise TimeoutError, "Gemini request timed out"
  rescue => e
    raise ServiceError, "Gemini error: #{e.message}"
  end

  # Single (non-streaming) completion — returns the full text string.
  def self.complete(prompt:, model: DEFAULT_MODEL, max_tokens: 2048)
    body = {
      contents:         [ { role: "user", parts: [ { text: prompt } ] } ],
      generationConfig: { maxOutputTokens: max_tokens, thinkingConfig: { thinkingBudget: 0 } }
    }

    uri      = URI("#{BASE_URL}/v1beta/models/#{model}:generateContent?key=#{api_key}")
    req      = Net::HTTP::Post.new(uri, "Content-Type" => "application/json")
    req.body = body.to_json

    res = Net::HTTP.start(uri.host, uri.port, use_ssl: true, read_timeout: 60) { |h| h.request(req) }

    handle_error_status!(res.code.to_i)

    parsed = JSON.parse(res.body)
    parsed.dig("candidates", 0, "content", "parts", 0, "text") || ""
  rescue RateLimitError, TimeoutError, ServiceError
    raise
  rescue Net::ReadTimeout
    raise TimeoutError, "Gemini request timed out"
  rescue => e
    raise ServiceError, "Gemini error: #{e.message}"
  end

  class RateLimitError < StandardError; end
  class TimeoutError   < StandardError; end
  class ServiceError   < StandardError; end

  class << self
    private

    def api_key
      ENV.fetch("GEMINI_API_KEY")
    end

    # Convert {role:, content:} hashes → Gemini contents array.
    # - "assistant" → "model" (Gemini convention)
    # - Merge consecutive same-role turns (Gemini rejects them)
    # - Drop leading model turns (Gemini requires user turn first)
    def gemini_contents(messages)
      result = []
      messages.each do |m|
        role    = (m[:role] || m["role"]).to_s
        content = (m[:content] || m["content"]).to_s
        role    = "model" if role == "assistant"
        role    = "user"  unless %w[user model].include?(role)

        if result.last && result.last[:role] == role
          result.last[:parts][0][:text] += "\n#{content}"
        else
          result << { role: role, parts: [ { text: content } ] }
        end
      end

      # Gemini requires conversation to start with a user turn
      result.shift while result.first && result.first[:role] != "user"
      result
    end

    def handle_error_status!(code)
      case code
      when 429 then raise RateLimitError, "Gemini rate limit reached (429)"
      when 408, 504 then raise TimeoutError, "Gemini timeout (#{code})"
      when 500..599 then raise ServiceError, "Gemini server error (#{code})"
      end
    end
  end
end
