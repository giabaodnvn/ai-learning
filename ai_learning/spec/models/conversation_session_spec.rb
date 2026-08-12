# frozen_string_literal: true

require "rails_helper"

RSpec.describe ConversationSession do
  let(:user)    { FactoryBot.create(:user) }
  let(:session) { user.conversation_sessions.create!(role: "tutor", jlpt_level: "n5") }

  describe "#add_message" do
    it "appends in order" do
      session.add_message(role: "user",      content: "こんにちは")
      session.add_message(role: "assistant", content: "はい")

      expect(session.reload.messages.map { |m| m["content"] }).to eq([ "こんにちは", "はい" ])
    end

    it "keeps only structured metadata that is present" do
      session.add_message(role: "assistant", content: "はい", corrections: [], new_words: [ { "word" => "犬" } ])

      msg = session.reload.messages.last
      expect(msg).not_to have_key("corrections")   # blank — omitted
      expect(msg).to have_key("new_words")
    end

    it "caps the history at MAX_MESSAGES, dropping the oldest" do
      (described_class::MAX_MESSAGES + 2).times { |i| session.add_message(role: "user", content: "m#{i}") }

      messages = session.reload.messages
      expect(messages.size).to eq(described_class::MAX_MESSAGES)
      expect(messages.first["content"]).to eq("m2")
    end

    # Appending to a JSON column is a read-modify-write of the whole array.
    # Two instances loaded before either saved — two tabs on one conversation —
    # used to write over each other, and the first message disappeared with no
    # error at all.
    it "does not lose a message written through a separately loaded instance" do
      first  = described_class.find(session.id)
      second = described_class.find(session.id)

      first.add_message(role: "user", content: "A")
      second.add_message(role: "user", content: "B")

      expect(session.reload.messages.map { |m| m["content"] }).to eq([ "A", "B" ])
    end
  end
end
