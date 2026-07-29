# frozen_string_literal: true

# Asking the model for JSON, and getting a Hash back out of whatever it
# actually returned.
#
# Every JSON-producing endpoint repeated the same pair — `ClaudeService.complete`
# followed by a bespoke extraction of the JSON from the reply — so both halves
# live here. Extraction failures are raised as ClaudeService::ServiceError so
# they land on the AI-error path (503, or an SSE error event) that controllers
# already handle, rather than surfacing as a 500.
module AiJson
  # Ask the model and parse the reply.
  def self.complete(prompt:, feature:, user_id:, max_tokens: 2048)
    parse(
      ClaudeService.complete(
        prompt:     prompt,
        max_tokens: max_tokens,
        log_usage:  { feature: feature, user_id: user_id }
      )
    )
  end

  # Gemini wraps JSON in markdown fences, or adds a sentence of preamble, or
  # neither. Try each extraction in turn, falling through on failure — a
  # strategy that matches but yields invalid JSON must not abort the rest.
  def self.parse(raw)
    text = raw.to_s

    candidates(text).each do |candidate|
      parsed = try_parse(candidate)
      return parsed unless parsed.nil?
    end

    raise ClaudeService::ServiceError, "AI returned unparseable JSON: #{text.truncate(200)}"
  end

  # Ordered extraction attempts, most specific first.
  def self.candidates(text)
    fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)&.captures&.first&.strip

    [
      fenced,
      # Objects and arrays are both valid top-level shapes: the grammar-set
      # prompt asks for an array, and scanning only for `{ … }` sliced it down
      # to `{...},{...}`, which never parses.
      outermost(text, "{", "}"),
      outermost(text, "[", "]"),
      text.strip
    ].compact.uniq
  end
  private_class_method :candidates

  def self.outermost(text, open_char, close_char)
    start  = text.index(open_char)
    finish = text.rindex(close_char)
    return nil unless start && finish && finish > start

    text[start..finish]
  end
  private_class_method :outermost

  def self.try_parse(candidate)
    JSON.parse(candidate)
  rescue JSON::ParserError
    nil
  end
  private_class_method :try_parse
end
