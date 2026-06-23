# frozen_string_literal: true

require "rails_helper"

RSpec.describe Vocabulary, type: :model do
  describe "uniqueness of word scoped to jlpt_level" do
    before { FactoryBot.create(:vocabulary, word: "猫", jlpt_level: "n5") }

    it "rejects a duplicate word within the same level" do
      dup = FactoryBot.build(:vocabulary, word: "猫", jlpt_level: "n5")
      expect(dup).not_to be_valid
      expect(dup.errors[:word]).to be_present
    end

    it "allows the same word at a different level" do
      other = FactoryBot.build(:vocabulary, word: "猫", jlpt_level: "n1")
      expect(other).to be_valid
    end
  end
end
