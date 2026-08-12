# frozen_string_literal: true

require "rails_helper"

# Pins which endpoints spend a slot in the per-user AI budget
# (Rack::Attack's "ai/user" throttle, 20 requests/minute).
#
# The list used to be path prefixes, so every sibling read under an AI resource
# was throttled too — browsing the grammar list could 429 without a single AI
# call. Deriving the check from the real route table is what keeps the matcher
# and the routes from drifting apart again: a new AI action that is not listed
# in AI_ENDPOINTS shows up here as an unthrottled path.
RSpec.describe "Rack::Attack AI endpoint matching" do
  # Every route whose action can reach ClaudeService, with :id filled in.
  AI_ROUTES = [
    "/api/v1/vocabulary/explain",
    "/api/v1/vocabularies/7/explain",
    "/api/v1/writing/feedback",
    "/api/v1/reading_passages",              # index generates when the level is empty
    "/api/v1/reading_passages/generate",
    "/api/v1/reading_passages/7/word_lookup",
    "/api/v1/listening_exercises",           # ditto
    "/api/v1/listening_exercises/generate",
    "/api/v1/level_tests/generate",
    "/api/v1/conversations/7/send_message",
    "/api/v1/grammar_points/7/check_sentence",
    "/api/v1/grammar_points/7/generate_exercise",
    "/api/v1/grammar_points/7/ask",
    "/api/v1/grammar_points/7/generate_set"
  ].freeze

  def api_paths
    Rails.application.routes.routes
         .map { |r| r.path.spec.to_s.sub("(.:format)", "").gsub(":id", "7") }
         .select { |p| p.start_with?("/api/") }
         .uniq
  end

  it "throttles every AI endpoint" do
    not_matched = AI_ROUTES.reject { |path| Rack::Attack::AI_ENDPOINTS.match?(path) }

    expect(not_matched).to be_empty,
      "these AI endpoints are not covered by the AI budget: #{not_matched.inspect}"
  end

  it "throttles nothing else in the API" do
    over_matched = api_paths.select { |p| Rack::Attack::AI_ENDPOINTS.match?(p) } - AI_ROUTES

    expect(over_matched).to be_empty,
      "these non-AI routes spend a slot in the AI budget: #{over_matched.inspect}"
  end

  it "still matches when the client appends a format suffix" do
    expect(Rack::Attack::AI_ENDPOINTS).to match("/api/v1/writing/feedback.json")
  end

  # The routes named here were deleted; nothing must resurrect them as prefixes.
  it "does not match the removed sibling routes" do
    %w[
      /api/v1/grammar_points
      /api/v1/grammar_points/7
      /api/v1/grammar_points/7/streak_info
      /api/v1/conversations
      /api/v1/listening_exercises/stats
      /api/v1/level_tests
      /api/v1/reading_passages/7/answer
    ].each do |path|
      expect(Rack::Attack::AI_ENDPOINTS).not_to match(path), "#{path} should not be AI-throttled"
    end
  end
end
