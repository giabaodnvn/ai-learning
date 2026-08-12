# frozen_string_literal: true

require "rails_helper"

RSpec.describe RecordAiUsageJob, type: :job do
  describe "AiUsageLog.record_async" do
    # `Sidekiq.testing!` is the Sidekiq 8 entry point; it loads sidekiq/test_api
    # itself. The old `require "sidekiq/testing"` shim warned on every suite run
    # and goes away in Sidekiq 9.
    it "enqueues a RecordAiUsageJob instead of writing inline" do
      Sidekiq.testing!(:fake) do
        RecordAiUsageJob.clear
        expect {
          AiUsageLog.record_async(
            feature: "chat", model: "gemini-2.5-flash",
            input_tokens: 10, output_tokens: 5, user_id: nil
          )
        }.to change(RecordAiUsageJob.jobs, :size).by(1)
      end
    end
  end

  describe "#perform" do
    it "creates an AiUsageLog row from the serialized attrs" do
      expect {
        described_class.new.perform(
          "feature"       => "chat",
          "model"         => "gemini-2.5-flash",
          "input_tokens"  => 10,
          "output_tokens" => 5,
          "user_id"       => nil,
          "cached"        => false,
          "created_at"    => Time.current.iso8601
        )
      }.to change(AiUsageLog, :count).by(1)

      log = AiUsageLog.last
      expect(log.feature).to eq("chat")
      expect(log.model).to eq("gemini-2.5-flash")
      expect(log.input_tokens).to eq(10)
      expect(log.output_tokens).to eq(5)
      expect(log.cached).to be false
    end
  end
end
