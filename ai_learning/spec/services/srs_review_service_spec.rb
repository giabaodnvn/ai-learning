# frozen_string_literal: true

require "rails_helper"

RSpec.describe SrsReviewService do
  let(:user)  { FactoryBot.create(:user) }
  let(:vocab) { FactoryBot.create(:vocabulary) }

  def build_new_progress
    user.user_card_progresses.new(
      card_type: "vocabulary",
      card_id:   vocab.id,
      **SrsService.initial_state.merge(jlpt_level: vocab.jlpt_level)
    )
  end

  describe ".apply!" do
    it "persists a new progress row and records the study session" do
      progress = described_class.apply!(user: user, progress: build_new_progress, grade: 3)

      expect(progress).to be_persisted
      expect(progress.repetitions).to eq(1)
      expect(progress.learned).to be(true)
      expect(progress.last_reviewed_at).to be_present
    end

    it "increments the daily study log and streak" do
      described_class.apply!(user: user, progress: build_new_progress, grade: 3)

      log = StudyLog.find_by(user_id: user.id, studied_on: Date.current)
      expect(log.cards_reviewed).to eq(1)
      expect(log.correct_count).to eq(1)
      expect(user.reload.streak_count).to eq(1)
    end

    it "stacks on the persisted state for an existing row (no lost update)" do
      described_class.apply!(user: user, progress: build_new_progress, grade: 3)

      existing = user.user_card_progresses.find_by(card_type: "vocabulary", card_id: vocab.id)
      described_class.apply!(user: user, progress: existing, grade: 3)

      expect(existing.reload.repetitions).to eq(2)
      log = StudyLog.find_by(user_id: user.id, studied_on: Date.current)
      expect(log.cards_reviewed).to eq(2)
    end

    it "leaves learned false on a failing grade" do
      progress = described_class.apply!(user: user, progress: build_new_progress, grade: 0)

      expect(progress.learned).to be(false)
      expect(progress.repetitions).to eq(0)
    end
  end
end
