# frozen_string_literal: true

require "rails_helper"

RSpec.describe SrsService, type: :service do
  describe ".calculate_next_review" do
    let(:defaults) do
      { ease_factor: 2.5, interval: 1, repetitions: 0 }
    end

    # ── Grade mapping ──────────────────────────────────────────────────────────

    it "accepts grades 0-3" do
      (0..3).each do |g|
        expect { described_class.calculate_next_review(**defaults, grade: g) }
          .not_to raise_error
      end
    end

    it "raises ArgumentError for grade outside 0-3" do
      expect { described_class.calculate_next_review(**defaults, grade: 4) }
        .to raise_error(ArgumentError)
      expect { described_class.calculate_next_review(**defaults, grade: -1) }
        .to raise_error(ArgumentError)
    end

    # ── First review (repetitions = 0) ────────────────────────────────────────

    context "first review" do
      it "grade 2 (good): interval becomes 1, repetitions becomes 1" do
        result = described_class.calculate_next_review(**defaults, grade: 2)
        expect(result[:new_repetitions]).to eq(1)
        expect(result[:new_interval]).to    eq(1)
      end

      it "grade 3 (easy): interval becomes 1, repetitions becomes 1" do
        result = described_class.calculate_next_review(**defaults, grade: 3)
        expect(result[:new_repetitions]).to eq(1)
        expect(result[:new_interval]).to    eq(1)
      end

      it "grade 0 (again): interval stays 1, repetitions stays 0" do
        result = described_class.calculate_next_review(**defaults, grade: 0)
        expect(result[:new_repetitions]).to eq(0)
        expect(result[:new_interval]).to    eq(1)
      end
    end

    # ── Second review (repetitions = 1) ───────────────────────────────────────

    context "second review (repetitions=1)" do
      let(:state) { { ease_factor: 2.5, interval: 1, repetitions: 1 } }

      it "grade 2 (good): interval becomes 6" do
        result = described_class.calculate_next_review(**state, grade: 2)
        expect(result[:new_repetitions]).to eq(2)
        expect(result[:new_interval]).to    eq(6)
      end

      it "grade 0 (again): resets to interval 1, repetitions 0" do
        result = described_class.calculate_next_review(**state, grade: 0)
        expect(result[:new_repetitions]).to eq(0)
        expect(result[:new_interval]).to    eq(1)
      end
    end

    # ── Third+ review (repetitions = 2) ───────────────────────────────────────

    context "third review (repetitions=2, interval=6)" do
      let(:state) { { ease_factor: 2.5, interval: 6, repetitions: 2 } }

      it "grade 2 (good): interval = round(6 * 2.5) = 15" do
        result = described_class.calculate_next_review(**state, grade: 2)
        expect(result[:new_interval]).to    eq(15)
        expect(result[:new_repetitions]).to eq(3)
      end

      it "grade 3 (easy): interval = 15, ease_factor increases" do
        result = described_class.calculate_next_review(**state, grade: 3)
        expect(result[:new_interval]).to      eq(15)
        expect(result[:new_ease_factor]).to   be > 2.5
      end

      it "grade 1 (hard): interval = round(6 * 2.5) = 15, ease_factor decreases" do
        result = described_class.calculate_next_review(**state, grade: 1)
        expect(result[:new_interval]).to     eq(15)
        expect(result[:new_ease_factor]).to  be < 2.5
      end
    end

    # ── Ease-factor floor ─────────────────────────────────────────────────────

    context "ease-factor floor at 1.3" do
      it "never drops below 1.3 even after repeated hard reviews" do
        state = { ease_factor: 1.31, interval: 6, repetitions: 2 }
        result = described_class.calculate_next_review(**state, grade: 1)
        expect(result[:new_ease_factor]).to be >= 1.3
      end
    end

    # ── Relearning after "again" ──────────────────────────────────────────────

    context "relearning: again after an established card" do
      let(:state) { { ease_factor: 2.3, interval: 15, repetitions: 3 } }

      it "resets repetitions to 0 and interval to 1" do
        result = described_class.calculate_next_review(**state, grade: 0)
        expect(result[:new_repetitions]).to eq(0)
        expect(result[:new_interval]).to    eq(1)
      end

      it "preserves ease_factor on failure" do
        result = described_class.calculate_next_review(**state, grade: 0)
        expect(result[:new_ease_factor]).to eq(2.3)
      end

      it "due_date is tomorrow after again" do
        travel_to Date.new(2026, 1, 1) do
          result = described_class.calculate_next_review(**state, grade: 0)
          expect(result[:due_date]).to eq(Date.new(2026, 1, 2))
        end
      end
    end

    # ── due_date ──────────────────────────────────────────────────────────────

    it "due_date equals today + new_interval days" do
      travel_to Date.new(2026, 3, 26) do
        result = described_class.calculate_next_review(**defaults, grade: 2)
        expect(result[:due_date]).to eq(Date.new(2026, 3, 27))
      end
    end
  end

  describe ".initial_state" do
    it "returns sane defaults for a brand-new card" do
      state = described_class.initial_state
      expect(state[:interval]).to    eq(1)
      expect(state[:ease_factor]).to eq(2.5)
      expect(state[:repetitions]).to eq(0)
      expect(state[:due_date]).to    eq(Date.current)
    end
  end
end
