# frozen_string_literal: true

require "rails_helper"
require_relative "../../../support/request_auth"

# Locks the typed SSE protocol of the chat endpoint ({type: "delta"} …
# {type: "correction"} … {type: "done"}), which the chat page parses by `type`.
RSpec.describe "POST /api/v1/conversations/:id/send_message (SSE)", type: :request do
  include RequestAuth

  let(:user)    { FactoryBot.create(:user) }
  let(:session) { user.conversation_sessions.create!(role: "tutor", jlpt_level: "n5") }

  def parse_sse(body)
    body.scan(/^data: (.+)$/).map { |m| JSON.parse(m.first) }
  end

  it "streams deltas, then a correction event, then done" do
    allow(ClaudeService).to receive(:chat) do |**_kwargs, &block|
      block.call("はい")
      block.call("、そうです")
    end

    post "/api/v1/conversations/#{session.id}/send_message",
         params: { content: "こんにちは" }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(response.headers["Content-Type"]).to include("text/event-stream")

    events = parse_sse(response.body)

    deltas = events.select { |e| e["type"] == "delta" }
    expect(deltas.map { |e| e["content"] }.join).to eq("はい、そうです")

    correction = events.find { |e| e["type"] == "correction" }
    expect(correction).to include("content", "corrections", "new_words", "translation_vi")

    expect(events.last["type"]).to eq("done")
  end

  it "persists the user message and the assistant reply on the session" do
    allow(ClaudeService).to receive(:chat) { |**_kwargs, &block| block.call("はい") }

    post "/api/v1/conversations/#{session.id}/send_message",
         params: { content: "こんにちは" }, headers: auth_headers(user)

    roles = session.reload.messages.map { |m| m["role"] }
    expect(roles).to eq(%w[user assistant])
  end
end
