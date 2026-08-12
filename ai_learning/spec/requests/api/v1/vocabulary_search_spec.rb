# frozen_string_literal: true

require "rails_helper"

# Pins the level/search interaction the vocabulary grid depends on.
#
# The grid hides its level tabs while a search is running and labels the result
# "N kết quả cho …" — i.e. it presents search as spanning every level. That only
# holds if omitting `level` really does search all of them, which is what
# JlptLeveled's `by_level` (a no-op for a blank level) provides.
RSpec.describe "GET /api/v1/vocabularies", type: :request do
  let(:user) { FactoryBot.create(:user) }

  before do
    Vocabulary.create!(word: "難解", reading: "なんかい", meaning_vi: "khó hiểu",  jlpt_level: "n1")
    Vocabulary.create!(word: "難しい", reading: "むずかしい", meaning_vi: "khó",    jlpt_level: "n5")
  end

  def words_in_response
    JSON.parse(response.body)["data"].map { |row| row.dig("attributes", "word") }
  end

  it "searches across every level when no level is given" do
    get "/api/v1/vocabularies", params: { search: "難" }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(words_in_response).to contain_exactly("難解", "難しい")
  end

  it "searches within one level when a level is given" do
    get "/api/v1/vocabularies", params: { search: "難", level: "n5" }, headers: auth_headers(user)

    expect(words_in_response).to eq([ "難しい" ])
  end

  # A blank level is what the client sends to mean "every level"; it must not be
  # taken as a literal jlpt_level to match on.
  it "treats a blank level as no level filter" do
    get "/api/v1/vocabularies", params: { search: "難", level: "" }, headers: auth_headers(user)

    expect(words_in_response).to contain_exactly("難解", "難しい")
  end
end
