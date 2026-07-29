# frozen_string_literal: true

require "rails_helper"

RSpec.describe DueCardsQuery do
  let(:user)  { FactoryBot.create(:user) }
  let(:vocab) { FactoryBot.create(:vocabulary, jlpt_level: "n5") }
  let(:kanji) { Kanji.create!(character: "日", meaning_vi: "nhật", jlpt_level: "n4", stroke_count: 4) }

  def progress_for(card_type, card_id, jlpt_level:, due_date: Date.current)
    UserCardProgress
      .find_or_build_for(user, card_type: card_type, card_id: card_id, jlpt_level: jlpt_level)
      .tap { |p| p.update!(due_date: due_date) }
  end

  it "returns cards due today across all types" do
    progress_for("vocabulary", vocab.id, jlpt_level: "n5")
    progress_for("kanji", kanji.id, jlpt_level: "n4")

    result = described_class.new(user).call

    expect(result.total).to eq(2)
    expect(result.progresses.size).to eq(2)
  end

  it "excludes cards that are not due yet" do
    progress_for("vocabulary", vocab.id, jlpt_level: "n5", due_date: Date.current + 3)

    expect(described_class.new(user).call.total).to eq(0)
  end

  it "filters by card type" do
    progress_for("vocabulary", vocab.id, jlpt_level: "n5")
    progress_for("kanji", kanji.id, jlpt_level: "n4")

    result = described_class.new(user, type: "kanji").call

    expect(result.total).to eq(1)
    expect(result.progresses.first.card_type).to eq("kanji")
  end

  it "filters by JLPT level" do
    progress_for("vocabulary", vocab.id, jlpt_level: "n5")
    progress_for("kanji", kanji.id, jlpt_level: "n4")

    expect(described_class.new(user, level: "n4").call.total).to eq(1)
  end

  describe "Result#each_card" do
    it "yields each progress row with its content record" do
      progress_for("vocabulary", vocab.id, jlpt_level: "n5")

      pairs = described_class.new(user).call.each_card { |p, card| [ p.card_type, card.id ] }

      expect(pairs).to eq([ [ "vocabulary", vocab.id ] ])
    end

    it "skips rows whose content record was deleted" do
      progress_for("vocabulary", vocab.id, jlpt_level: "n5")
      progress_for("kanji", 999_999, jlpt_level: "n4")

      result = described_class.new(user).call

      expect(result.total).to eq(2)
      expect(result.each_card { |p, _| p.card_type }).to eq([ "vocabulary" ])
    end
  end
end
