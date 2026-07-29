# frozen_string_literal: true

require "rails_helper"

RSpec.describe CardCatalog do
  describe ".model_for" do
    it "maps every known card type to its model" do
      expect(described_class.model_for("vocabulary")).to eq(Vocabulary)
      expect(described_class.model_for("kanji")).to eq(Kanji)
      expect(described_class.model_for("grammar_point")).to eq(GrammarPoint)
    end

    it "returns nil for an unknown type" do
      expect(described_class.model_for("nope")).to be_nil
    end
  end

  describe ".batch_load" do
    let(:user)  { FactoryBot.create(:user) }
    let(:vocab) { FactoryBot.create(:vocabulary) }
    let(:kanji) { Kanji.create!(character: "日", meaning_vi: "nhật", jlpt_level: "n5", stroke_count: 4) }

    it "loads mixed card types in one query per type, keyed type:id" do
      progresses = [
        UserCardProgress.find_or_build_for(user, card_type: "vocabulary", card_id: vocab.id, jlpt_level: "n5"),
        UserCardProgress.find_or_build_for(user, card_type: "kanji", card_id: kanji.id, jlpt_level: "n5")
      ]

      records = described_class.batch_load(progresses)

      expect(records["vocabulary:#{vocab.id}"]).to eq(vocab)
      expect(records["kanji:#{kanji.id}"]).to eq(kanji)
    end

    it "omits progress rows whose content record was deleted" do
      progresses = [
        UserCardProgress.find_or_build_for(user, card_type: "vocabulary", card_id: 999_999, jlpt_level: "n5")
      ]

      expect(described_class.batch_load(progresses)).to be_empty
    end
  end
end
