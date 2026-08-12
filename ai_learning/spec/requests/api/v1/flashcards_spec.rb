# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Flashcards", type: :request do
  let(:user) { FactoryBot.create(:user, jlpt_level: "n5") }

  def kanji!(character, level: "n5")
    Kanji.create!(character: character, meaning_vi: "nghĩa #{character}", jlpt_level: level, stroke_count: 4)
  end

  def json = JSON.parse(response.body)

  describe "GET /api/v1/flashcards/due" do
    let(:vocab) { FactoryBot.create(:vocabulary, jlpt_level: "n5") }

    it "returns cards due today with their SRS state and content merged" do
      UserCardProgress.find_or_build_for(user, card_type: "vocabulary", card_id: vocab.id, jlpt_level: "n5").save!

      get "/api/v1/flashcards/due", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json["total_due"]).to eq(1)

      card = json["cards"].first
      expect(card).to include(
        "card_type"  => "vocabulary",
        "card_id"    => vocab.id,
        "jlpt_level" => "n5",
        "word"       => vocab.word,
        "meaning_vi" => vocab.meaning_vi
      )
      expect(card["progress_id"]).to be_present
    end

    it "filters by card type" do
      UserCardProgress.find_or_build_for(user, card_type: "vocabulary", card_id: vocab.id, jlpt_level: "n5").save!

      get "/api/v1/flashcards/due", params: { type: "kanji" }, headers: auth_headers(user)

      expect(json["total_due"]).to eq(0)
    end
  end

  describe "GET /api/v1/flashcards/new" do
    it "returns unstudied cards of the requested type" do
      vocab = FactoryBot.create(:vocabulary, jlpt_level: "n5")

      get "/api/v1/flashcards/new", params: { type: "vocabulary", level: "n5" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json["cards"].map { |c| c["card_id"] }).to include(vocab.id)
      # No progress row yet — reported at the initial SRS state.
      expect(json["cards"].first).to include("progress_id" => nil, "repetitions" => 0, "interval" => 1)
    end

    it "excludes cards the user has already started" do
      vocab = FactoryBot.create(:vocabulary, jlpt_level: "n5")
      UserCardProgress.find_or_build_for(user, card_type: "vocabulary", card_id: vocab.id, jlpt_level: "n5").save!

      get "/api/v1/flashcards/new", params: { type: "vocabulary", level: "n5" }, headers: auth_headers(user)

      expect(json["cards"].map { |c| c["card_id"] }).not_to include(vocab.id)
    end

    it "draws from every type when type=all, respecting each per-day cap" do
      FactoryBot.create(:vocabulary, jlpt_level: "n5")
      kanji!("日")
      GrammarPoint.create!(pattern: "〜です", explanation_vi: "là", jlpt_level: "n5")

      get "/api/v1/flashcards/new", params: { type: "all", level: "n5" }, headers: auth_headers(user)

      expect(json["cards"].map { |c| c["card_type"] }.uniq)
        .to contain_exactly("vocabulary", "kanji", "grammar_point")
      expect(json["total_new"]).to eq(3)
    end

    it "rejects an unknown type" do
      get "/api/v1/flashcards/new", params: { type: "bogus" }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/flashcards/random" do
    before do
      3.times { FactoryBot.create(:vocabulary, jlpt_level: "n5") }
      kanji!("日")
    end

    # Also covers CardCatalog.in_random_order producing valid SQL.
    it "returns a mix of cards for the level, capped by the count params" do
      get "/api/v1/flashcards/random",
          params: { level: "n5", vocab: 2, kanji: 1, grammar: 1 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json["level"]).to eq("n5")

      by_type = json["cards"].group_by { |c| c["card_type"] }
      expect(by_type["vocabulary"].size).to eq(2)
      expect(by_type["kanji"].size).to eq(1)
      expect(json["cards"]).to all(include("learned" => false))
    end

    it "clamps a count above the per-type maximum" do
      get "/api/v1/flashcards/random", params: { level: "n5", vocab: 9999 }, headers: auth_headers(user)

      expect(json["cards"].count { |c| c["card_type"] == "vocabulary" }).to eq(3)
    end

    it "flags cards the user has already marked learned" do
      vocab = Vocabulary.by_level("n5").first
      UserCardProgress.set_learned!(user, card_type: "vocabulary", card: vocab, learned: true)

      get "/api/v1/flashcards/random", params: { level: "n5", vocab: 50 }, headers: auth_headers(user)

      learned = json["cards"].select { |c| c["learned"] }
      expect(learned.map { |c| c["card_id"] }).to eq([ vocab.id ])
    end
  end

  describe "POST /api/v1/flashcards/quiz" do
    it "builds a 4-option question whose `correct` indexes the right answer" do
      4.times { FactoryBot.create(:vocabulary, jlpt_level: "n5") }
      vocab = Vocabulary.by_level("n5").first

      post "/api/v1/flashcards/quiz",
           params: { cards: [ { card_type: "vocabulary", card_id: vocab.id } ] },
           headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      question = json["questions"].first
      expect(question["card_id"]).to eq(vocab.id)
      expect(question["question"]).to eq(vocab.word)
      expect(question["options"].size).to eq(4)
      expect(question["options"][question["correct"]])
        .to eq(vocab.meaning_vi.split(/[,、]/).first.strip)
    end

    it "pads the options when there are too few cards to draw distractors from" do
      vocab = FactoryBot.create(:vocabulary, jlpt_level: "n5")

      post "/api/v1/flashcards/quiz",
           params: { cards: [ { card_type: "vocabulary", card_id: vocab.id } ] },
           headers: auth_headers(user)

      expect(json["questions"].first["options"].size).to eq(4)
    end

    it "skips unknown types and missing cards instead of failing the batch" do
      vocab = FactoryBot.create(:vocabulary, jlpt_level: "n5")

      post "/api/v1/flashcards/quiz",
           params: { cards: [
             { card_type: "bogus",      card_id: vocab.id },
             { card_type: "vocabulary", card_id: 999_999 },
             { card_type: "vocabulary", card_id: vocab.id }
           ] },
           headers: auth_headers(user)

      expect(json["questions"].size).to eq(1)
    end
  end

  describe "POST /api/v1/flashcards/review" do
    let(:vocab) { FactoryBot.create(:vocabulary, jlpt_level: "n5") }

    it "creates progress and schedules the next review" do
      expect {
        post "/api/v1/flashcards/review",
             params: { card_type: "vocabulary", card_id: vocab.id, grade: 3 },
             headers: auth_headers(user)
      }.to change { user.user_card_progresses.count }.by(1)

      expect(response).to have_http_status(:ok)
      expect(json).to include("next_due", "interval", "ease_factor", "cards_remaining_today")
    end

    it "rejects a grade outside 0-3" do
      post "/api/v1/flashcards/review",
           params: { card_type: "vocabulary", card_id: vocab.id, grade: 7 },
           headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "404s when creating progress for a card that does not exist" do
      post "/api/v1/flashcards/review",
           params: { card_type: "vocabulary", card_id: 999_999, grade: 2 },
           headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    # Regression: Integer() raises TypeError (not ArgumentError) on a nested
    # object, which was not rescued and surfaced as a 500.
    it "rejects a non-scalar grade" do
      post "/api/v1/flashcards/review",
           params: { card_type: "vocabulary", card_id: vocab.id, grade: { n: 1 } },
           headers: auth_headers(user), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
