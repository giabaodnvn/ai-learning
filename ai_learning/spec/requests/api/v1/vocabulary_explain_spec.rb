# frozen_string_literal: true

require "rails_helper"
require_relative "../../../support/request_auth"

# Characterization spec for the SSE streaming explain endpoint.
# Locks the streamed event shape before extracting the duplicated
# stream_sse + ClaudeService.chat block into a shared helper and merging
# vocabulary#explain / #explain_by_id.
RSpec.describe "Api::V1::Vocabulary explain (SSE)", type: :request do
  include RequestAuth

  let(:user) { FactoryBot.create(:user) }

  def parse_sse(body)
    body.scan(/^data: (.+)$/).map { |m| JSON.parse(m.first) }
  end

  describe "POST /api/v1/vocabulary/explain" do
    it "streams text deltas followed by a done event" do
      allow(ClaudeService).to receive(:chat) do |**_kwargs, &block|
        block.call("こんにちは")
        block.call(" world")
      end

      # Unique word so the redis cache key is fresh (forces the streaming path).
      word = "テスト#{Time.now.to_i}"
      post "/api/v1/vocabulary/explain",
           params: { word: word, user_level: "n5" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.headers["Content-Type"]).to include("text/event-stream")

      events = parse_sse(response.body)
      expect(events.map { |e| e["delta"] }.join).to include("こんにちは world")
      expect(events.last["done"]).to be(true)
    end
  end
end
