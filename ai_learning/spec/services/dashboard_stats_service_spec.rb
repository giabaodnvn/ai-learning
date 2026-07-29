# frozen_string_literal: true

require "rails_helper"

RSpec.describe DashboardStatsService do
  let(:user)  { FactoryBot.create(:user, streak_count: 3) }
  let(:today) { Date.new(2026, 7, 27) }

  subject(:stats) { described_class.new(user, today: today).call }

  it "reports a full year of heatmap days ending today" do
    expect(stats[:activity_heatmap].size).to eq(DashboardStatsService::HEATMAP_DAYS)
    expect(stats[:activity_heatmap].last).to eq(date: today.to_s, count: 0)
    expect(stats[:activity_heatmap].first[:date]).to eq((today - 364).to_s)
  end

  it "returns nil accuracy when nothing was reviewed in the window" do
    expect(stats[:accuracy_7days]).to be_nil
  end

  it "computes accuracy from the last 7 days of study logs" do
    StudyLog.create!(user: user, studied_on: today, cards_reviewed: 4, correct_count: 3)

    expect(stats[:accuracy_7days]).to eq(75.0)
  end

  it "reports per-level progress against every available card type" do
    FactoryBot.create(:vocabulary, jlpt_level: "n5")
    FactoryBot.create(:vocabulary, jlpt_level: "n5")
    GrammarPoint.create!(pattern: "〜てから", explanation_vi: "sau khi", jlpt_level: "n5")

    expect(stats[:jlpt_progress]["n5"]).to eq(total: 3, learned: 0, percent: 0)
    expect(stats[:jlpt_progress]["n1"]).to eq(total: 0, learned: 0, percent: 0)
  end

  it "counts learned cards and cards due today" do
    vocab    = FactoryBot.create(:vocabulary, jlpt_level: "n5")
    progress = UserCardProgress.find_or_build_for(
      user, card_type: "vocabulary", card_id: vocab.id, jlpt_level: "n5"
    )
    progress.update!(learned: true, due_date: today)

    expect(stats[:vocab_learned]).to eq(1)
    expect(stats[:vocab_due_today]).to eq(1)
    expect(stats[:streak_count]).to eq(3)
  end
end
