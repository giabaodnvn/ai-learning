# frozen_string_literal: true

require "rails_helper"

RSpec.describe GrammarStreakService do
  subject(:service) { described_class.new(1, 42) }

  let(:key) { "grammar_streak:1:42" }

  before { AppRedis.current.del(key) }
  after  { AppRedis.current.del(key) }

  describe "#read" do
    it "returns an empty streak when nothing is stored" do
      expect(service.read).to eq(count: 0, last_date: nil)
    end

    it "returns an empty streak when the stored value is not JSON" do
      AppRedis.current.set(key, "{{{")

      expect(service.read).to eq(count: 0, last_date: nil)
    end
  end

  describe "#record!" do
    it "starts a streak at 1" do
      expect(service.record!).to eq(count: 1, last_date: Date.current.to_s)
    end

    it "does not double-count two practices on the same day" do
      service.record!

      expect(service.record![:count]).to eq(1)
    end

    it "increments when the last practice was yesterday" do
      AppRedis.current.set(key, { count: 4, last_date: (Date.current - 1).to_s }.to_json)

      expect(service.record![:count]).to eq(5)
    end

    it "resets when a day was skipped" do
      AppRedis.current.set(key, { count: 9, last_date: (Date.current - 2).to_s }.to_json)

      expect(service.record![:count]).to eq(1)
    end
  end
end
