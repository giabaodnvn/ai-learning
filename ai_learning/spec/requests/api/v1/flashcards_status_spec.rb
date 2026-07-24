# frozen_string_literal: true

require "rails_helper"
require_relative "../../../support/request_auth"

# Characterization spec for flashcards learned-status endpoints.
# Locks the success contract + row creation behaviour before refactoring the
# duplicated find_or_initialize + SrsService.initial_state blocks and adding
# RecordNotUnique race handling.
RSpec.describe "Api::V1::Flashcards status", type: :request do
  include RequestAuth

  let(:user)  { FactoryBot.create(:user) }
  let(:vocab) { FactoryBot.create(:vocabulary, jlpt_level: "n5") }

  describe "POST /api/v1/flashcards/status" do
    it "creates a progress row and returns learned:true" do
      expect {
        post "/api/v1/flashcards/status",
             params: { card_type: "vocabulary", card_id: vocab.id, learned: true },
             headers: auth_headers(user)
      }.to change { user.user_card_progresses.count }.by(1)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to eq("learned" => true)
      progress = user.user_card_progresses.find_by(card_type: "vocabulary", card_id: vocab.id)
      expect(progress.learned).to be(true)
      expect(progress.jlpt_level).to eq("n5")
    end

    it "updates an existing row without creating a duplicate" do
      post "/api/v1/flashcards/status",
           params: { card_type: "vocabulary", card_id: vocab.id, learned: true },
           headers: auth_headers(user)

      expect {
        post "/api/v1/flashcards/status",
             params: { card_type: "vocabulary", card_id: vocab.id, learned: false },
             headers: auth_headers(user)
      }.not_to change { user.user_card_progresses.count }

      expect(JSON.parse(response.body)).to eq("learned" => false)
    end

    it "returns 422 for an invalid card_type" do
      post "/api/v1/flashcards/status",
           params: { card_type: "bogus", card_id: 1, learned: true },
           headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "returns 404 when the card does not exist" do
      post "/api/v1/flashcards/status",
           params: { card_type: "vocabulary", card_id: 999_999, learned: true },
           headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/flashcards/status/bulk" do
    it "bulk-updates and returns the updated count + results" do
      v2 = FactoryBot.create(:vocabulary, jlpt_level: "n5")

      post "/api/v1/flashcards/status/bulk",
           params: { results: [
             { card_type: "vocabulary", card_id: vocab.id, learned: true },
             { card_type: "vocabulary", card_id: v2.id,    learned: true },
             { card_type: "vocabulary", card_id: 999_999,  learned: true }
           ] },
           headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["updated"]).to eq(2)
      expect(body["results"].map { |r| r["card_id"] }).to contain_exactly(vocab.id, v2.id)
    end
  end
end
