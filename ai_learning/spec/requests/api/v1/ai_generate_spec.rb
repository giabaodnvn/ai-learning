# frozen_string_literal: true

require "rails_helper"

# Characterization spec for the AI content-generation endpoints.
# Locks the success contract (status + persisted record + response shape) before
# refactoring the duplicated generate_and_save! + serializer methods.
RSpec.describe "Api::V1 AI content generation", type: :request do
  let(:user) { FactoryBot.create(:user) }

  describe "POST /api/v1/listening_exercises/generate" do
    let(:ai_json) do
      {
        title: "カフェの会話", script_ja: "いらっしゃいませ", script_vi: "Xin mời",
        questions: [ { "q" => "?", "options" => %w[a b], "correct_index" => 0 } ]
      }.to_json
    end

    it "creates an exercise and returns 201 with the serialized shape" do
      allow(ClaudeService).to receive(:complete).and_return(ai_json)

      expect {
        post "/api/v1/listening_exercises/generate",
             params: { topic: "カフェ", jlpt_level: "n5" }, headers: auth_headers(user)
      }.to change(ListeningExercise, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body).to include("id", "title", "script_ja", "script_vi", "jlpt_level", "topic", "questions", "ai_generated")
      expect(body["title"]).to eq("カフェの会話")
      expect(body["ai_generated"]).to be(true)
    end

    it "returns 503 (not 500) when the AI omits required fields" do
      allow(ClaudeService).to receive(:complete).and_return({ title: "只标题" }.to_json)

      expect {
        post "/api/v1/listening_exercises/generate",
             params: { topic: "カフェ", jlpt_level: "n5" }, headers: auth_headers(user)
      }.not_to change(ListeningExercise, :count)

      expect(response).to have_http_status(:service_unavailable)
      expect(JSON.parse(response.body)["error"]).to be_present
    end
  end

  describe "POST /api/v1/reading_passages/generate" do
    let(:ai_json) do
      {
        title: "私の一日", content: "朝起きます。",
        questions: [ { "q" => "?", "options" => %w[a b], "answer_index" => 0 } ],
        vocabulary_highlights: [ { "word" => "朝", "meaning_vi" => "buổi sáng" } ]
      }.to_json
    end

    it "creates a passage and returns 201 with the serialized shape" do
      allow(ClaudeService).to receive(:complete).and_return(ai_json)

      expect {
        post "/api/v1/reading_passages/generate",
             params: { topic: "日常", jlpt_level: "n5" }, headers: auth_headers(user)
      }.to change(ReadingPassage, :count).by(1)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body).to include("id", "title", "content", "questions", "vocabulary_highlights", "ai_generated")
      expect(body["title"]).to eq("私の一日")
    end

    it "returns 503 (not 500) when the AI omits the content field" do
      allow(ClaudeService).to receive(:complete).and_return({ title: "只标题" }.to_json)

      expect {
        post "/api/v1/reading_passages/generate",
             params: { topic: "日常", jlpt_level: "n5" }, headers: auth_headers(user)
      }.not_to change(ReadingPassage, :count)

      expect(response).to have_http_status(:service_unavailable)
      expect(JSON.parse(response.body)["error"]).to be_present
    end
  end

  describe "POST /api/v1/grammar_points/:id/check_sentence" do
    let(:point) { GrammarPoint.create!(pattern: "〜てform", explanation_vi: "dạng te", jlpt_level: "n5") }
    let(:ai_json) do
      { correct: true, errors: [], rewritten_sentence: "食べています", explanation_vi: "OK" }.to_json
    end

    it "returns 200 with the parsed AI JSON" do
      allow(ClaudeService).to receive(:complete).and_return(ai_json)

      post "/api/v1/grammar_points/#{point.id}/check_sentence",
           params: { sentence: "食べています" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body).to include("correct", "explanation_vi")
    end
  end
end
