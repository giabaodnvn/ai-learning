# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ListeningExercises submit", type: :request do
  def auth_headers(user)
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user) { FactoryBot.create(:user) }
  let(:exercise) do
    ListeningExercise.create!(
      jlpt_level: "n5", topic: "daily", title: "Test",
      script_ja: "テスト", script_vi: "kiem tra",
      questions: [
        { "question_ja" => "Q1", "options" => %w[A B C], "correct_index" => 1 },
        { "question_ja" => "Q2", "options" => %w[A B C], "correct_index" => 0 }
      ]
    )
  end

  def submit(answers)
    post "/api/v1/listening_exercises/#{exercise.id}/submit",
         params: { answers: answers }, headers: auth_headers(user), as: :json
  end

  it "grades each answer and records the attempt" do
    submit([
      { question_index: 0, answer_index: 1 },
      { question_index: 1, answer_index: 2 }
    ])

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body["score"]).to eq(1)
    expect(body["total"]).to eq(2)
    expect(body["percentage"]).to eq(50.0)
    expect(body["results"].map { |r| r["correct"] }).to eq([ true, false ])
    expect(body["results"][1]["explanation_vi"]).to eq("Đáp án đúng là: A")
    expect(user.listening_attempts.count).to eq(1)
  end

  it "404s when an answer points at a question that does not exist" do
    submit([ { question_index: 99, answer_index: 0 } ])

    expect(response).to have_http_status(:not_found)
    expect(user.listening_attempts.count).to eq(0)
  end

  # Regression: a scalar entry used to reach `1[:question_index]`, which raises
  # TypeError → 500 instead of being ignored.
  it "skips entries that are not objects instead of raising" do
    submit([ 1, { question_index: 0, answer_index: 1 } ])

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)["results"].size).to eq(1)
  end
end
