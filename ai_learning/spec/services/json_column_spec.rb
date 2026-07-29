# frozen_string_literal: true

require "rails_helper"

RSpec.describe JsonColumn do
  describe ".parse" do
    it "passes through already-decoded values" do
      expect(described_class.parse([ "a" ])).to eq([ "a" ])
      expect(described_class.parse({ "a" => 1 })).to eq({ "a" => 1 })
    end

    it "decodes a JSON string" do
      expect(described_class.parse('["a","b"]')).to eq(%w[a b])
    end

    it "falls back to an empty array on malformed input" do
      expect(described_class.parse("not json")).to eq([])
    end

    it "falls back to an empty array on nil" do
      expect(described_class.parse(nil)).to eq([])
    end
  end
end
