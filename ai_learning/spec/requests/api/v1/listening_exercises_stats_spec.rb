# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ListeningExercises stats", type: :request do
  def auth_headers(user)
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { FactoryBot.create(:user) }
  let(:exercise) do
    ListeningExercise.create!(
      jlpt_level: "n5", topic: "daily", title: "Test",
      script_ja: "テスト", script_vi: "kiem tra",
      questions: [{ "q" => "a", "answer_index" => 0 }]
    )
  end

  describe "GET /api/v1/listening_exercises/stats" do
    # Regression: previously raised MySQL only_full_group_by (500) because
    # `group(:speech_rate).each` selected non-aggregated columns.
    it "returns 200 with by_speed aggregated per speech_rate" do
      ListeningAttempt.create!(user: user, listening_exercise: exercise,
                               score: 8, total_questions: 10, speech_rate: 1.0)
      ListeningAttempt.create!(user: user, listening_exercise: exercise,
                               score: 6, total_questions: 10, speech_rate: 0.75)

      get "/api/v1/listening_exercises/stats", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body["total_attempts"]).to eq(2)
      expect(body["by_speed"]).to eq("1.0" => 0.8, "0.75" => 0.6)
    end

    it "returns empty by_speed when the user has no attempts" do
      get "/api/v1/listening_exercises/stats", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["by_speed"]).to eq({})
    end
  end
end
