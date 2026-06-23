# frozen_string_literal: true

require "rails_helper"

RSpec.describe Prompts::ConversationTutorPrompt, type: :service do
  describe ".parse_response" do
    # Regression: a malformed [CORRECTIONS] JSON block must fall through to the
    # default hash, not raise. Previously `rescue JSON::ParseError` (typo)
    # raised NameError instead of catching the parse error.
    context "when the [CORRECTIONS] block contains malformed JSON" do
      it "falls back gracefully without raising" do
        text = "Xin chào!\n[CORRECTIONS]\n{this is : not valid json,,}\n[/CORRECTIONS]"

        result = nil
        expect { result = described_class.parse_response(text) }.not_to raise_error

        expect(result[:content]).to eq("Xin chào!")
        expect(result[:corrections]).to eq([])
        expect(result[:new_words]).to eq([])
        expect(result[:translation_vi]).to be_nil
      end
    end

    context "when the [CORRECTIONS] block contains valid JSON" do
      it "extracts content and structured metadata" do
        json = '{"corrections":[{"original":"a","corrected":"b","explanation_vi":"x"}],' \
               '"new_words":[{"word":"猫","reading":"ねこ","meaning_vi":"con mèo"}],' \
               '"translation_vi":"xin chào"}'
        text = "Hello there\n[CORRECTIONS]#{json}[/CORRECTIONS]"

        result = described_class.parse_response(text)

        expect(result[:content]).to eq("Hello there")
        expect(result[:corrections].first["corrected"]).to eq("b")
        expect(result[:new_words].first["word"]).to eq("猫")
        expect(result[:translation_vi]).to eq("xin chào")
      end
    end

    context "when there is no [CORRECTIONS] block" do
      it "returns the whole text as content with empty metadata" do
        result = described_class.parse_response("Just a plain reply.")

        expect(result[:content]).to eq("Just a plain reply.")
        expect(result[:corrections]).to eq([])
        expect(result[:new_words]).to eq([])
        expect(result[:translation_vi]).to be_nil
      end
    end
  end
end
