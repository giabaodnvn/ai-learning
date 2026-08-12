# frozen_string_literal: true

require "rails_helper"

# Characterization spec: locks the HTTP contract returned when the AI service
# raises RateLimit / Timeout / ServiceError. This must survive the refactor
# that consolidates the duplicated rescue blocks into a shared handler.
#
# Target (consolidated) contract — the dominant style used by grammar/reading/
# listening/reading_passages:
#   RateLimitError -> 429, { error: <Vietnamese message> }
#   TimeoutError   -> 504, { error: <Vietnamese message> }
#   ServiceError   -> 503, { error: <Vietnamese message> }
RSpec.describe "Api::V1 AI error handling", type: :request do
  let(:user) { FactoryBot.create(:user) }

  shared_examples "maps AI errors to HTTP" do |perform|
    it "RateLimitError -> 429 with an error message" do
      allow(ClaudeService).to receive(:complete).and_raise(ClaudeService::RateLimitError)
      instance_exec(&perform)
      expect(response).to have_http_status(:too_many_requests)
      expect(JSON.parse(response.body)["error"]).to be_present
    end

    it "TimeoutError -> 504 with an error message" do
      allow(ClaudeService).to receive(:complete).and_raise(ClaudeService::TimeoutError)
      instance_exec(&perform)
      expect(response).to have_http_status(:gateway_timeout)
      expect(JSON.parse(response.body)["error"]).to be_present
    end

    it "ServiceError -> 503 with an error message" do
      allow(ClaudeService).to receive(:complete).and_raise(ClaudeService::ServiceError)
      instance_exec(&perform)
      expect(response).to have_http_status(:service_unavailable)
      expect(JSON.parse(response.body)["error"]).to be_present
    end
  end

  # `grammar/check` and `reading/generate` used to appear here too. Both were
  # removed along with their (uncalled) endpoints; the shared handler they
  # exercised is still covered by the four cases below.
  describe "POST /api/v1/reading_passages/generate" do
    include_examples "maps AI errors to HTTP", -> {
      post "/api/v1/reading_passages/generate", params: { topic: "旅行" }, headers: auth_headers(user)
    }
  end

  describe "POST /api/v1/listening_exercises/generate" do
    include_examples "maps AI errors to HTTP", -> {
      post "/api/v1/listening_exercises/generate", params: { topic: "旅行" }, headers: auth_headers(user)
    }
  end

  # These two endpoints previously returned an inconsistent contract
  # (timeout -> 408, body { error: "rate_limit" } / code strings). The
  # consolidation normalised them to the shared 429/504/503 + Vietnamese
  # message contract. The FE consumes neither the body nor the specific
  # status of these two, so the change is safe.
  describe "POST /api/v1/level_tests/generate (normalised)" do
    include_examples "maps AI errors to HTTP", -> {
      post "/api/v1/level_tests/generate", params: { level: "n5" }, headers: auth_headers(user)
    }
  end

  describe "POST /api/v1/grammar_points/:id/check_sentence (normalised)" do
    let(:point) { GrammarPoint.create!(pattern: "〜ば", explanation_vi: "điều kiện", jlpt_level: "n5") }

    # A unique sentence guarantees a redis cache miss so the (stubbed, raising)
    # ClaudeService is actually invoked rather than serving a cached result.
    include_examples "maps AI errors to HTTP", -> {
      post "/api/v1/grammar_points/#{point.id}/check_sentence",
           params: { sentence: "テスト文#{Time.now.to_f}" }, headers: auth_headers(user)
    }
  end
end
