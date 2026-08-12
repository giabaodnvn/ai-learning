# frozen_string_literal: true

require "rails_helper"

# Locks the review-queue JSON contract, which is built from the shared
# CardCatalog batch loader but nests content under a per-type key.
RSpec.describe "Api::V1::Review queue", type: :request do
  let(:user)  { FactoryBot.create(:user) }
  let(:vocab) { FactoryBot.create(:vocabulary, jlpt_level: "n5") }
  let(:kanji) do
    Kanji.create!(character: "日", meaning_vi: "nhật", jlpt_level: "n5",
                  stroke_count: 4, onyomi: [ "ニチ", "ジツ" ].to_json)
  end

  def due_progress!(card_type, card_id)
    progress = UserCardProgress.find_or_build_for(
      user, card_type: card_type, card_id: card_id, jlpt_level: "n5"
    )
    progress.update!(due_date: Date.current)
    progress
  end

  describe "POST /api/v1/review/submit" do
    # Regression: Integer() raises TypeError (not ArgumentError) on a nested
    # object, which was not rescued and surfaced as a 500.
    it "rejects a non-scalar quality" do
      progress = due_progress!("vocabulary", vocab.id)

      post "/api/v1/review/submit",
           params: { progress_id: progress.id, quality: { n: 4 } },
           headers: auth_headers(user), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  it "returns due vocabulary cards with the content nested under :vocabulary" do
    progress = due_progress!("vocabulary", vocab.id)

    get "/api/v1/review/queue", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["total_due"]).to eq(1)
    expect(body["cards"].first).to include(
      "id"        => progress.id,
      "card_type" => "vocabulary"
    )
    expect(body["cards"].first["vocabulary"]).to include(
      "id" => vocab.id, "word" => vocab.word, "jlpt_level" => "n5"
    )
  end

  it "joins kanji onyomi readings into reading_on" do
    due_progress!("kanji", kanji.id)

    get "/api/v1/review/queue", params: { type: "all" }, headers: auth_headers(user)

    card = JSON.parse(response.body)["cards"].first
    expect(card["card_type"]).to eq("kanji")
    expect(card["kanji"]["reading_on"]).to eq("ニチ、ジツ")
  end

  it "skips progress rows whose content record no longer exists" do
    due_progress!("vocabulary", vocab.id)
    vocab.destroy!

    get "/api/v1/review/queue", headers: auth_headers(user)

    expect(JSON.parse(response.body)["cards"]).to be_empty
  end
end
