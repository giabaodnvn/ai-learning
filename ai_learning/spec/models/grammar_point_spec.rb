# frozen_string_literal: true

require "rails_helper"

RSpec.describe GrammarPoint, type: :model do
  describe "uniqueness of pattern scoped to jlpt_level" do
    before do
      GrammarPoint.create!(pattern: "〜について", explanation_vi: "về việc", jlpt_level: "n4")
    end

    it "rejects a duplicate pattern within the same level" do
      dup = GrammarPoint.new(pattern: "〜について", explanation_vi: "x", jlpt_level: "n4")
      expect(dup).not_to be_valid
      expect(dup.errors[:pattern]).to be_present
    end

    it "allows the same pattern at a different level" do
      other = GrammarPoint.new(pattern: "〜について", explanation_vi: "x", jlpt_level: "n2")
      expect(other).to be_valid
    end
  end
end
