# frozen_string_literal: true

require "rails_helper"

RSpec.describe LevelTest, type: :model do
  # Two sections that are deliberately identical apart from their questions'
  # answers, to pin down the section-index handling.
  let(:sections) do
    [
      { "name" => "文法", "name_vi" => "Ngữ pháp", "questions" => [
        { "id" => 1, "question" => "Q1", "options" => %w[a b], "answer_index" => 0 },
        { "id" => 2, "question" => "Q2", "options" => %w[a b], "answer_index" => 1 }
      ] },
      { "name" => "文法", "name_vi" => "Ngữ pháp", "questions" => [
        { "id" => 1, "question" => "Q3", "options" => %w[a b], "answer_index" => 1 }
      ] }
    ]
  end

  let(:test_record) do
    described_class.new(
      jlpt_level: "n5", title: "T", sections: sections,
      total_questions: 3, pass_score: 2
    )
  end

  describe "#grade" do
    it "scores per section and marks a pass at or above pass_score" do
      answers = [
        { "section_index" => 0, "question_id" => 1, "answer_index" => 0 },
        { "section_index" => 0, "question_id" => 2, "answer_index" => 1 },
        { "section_index" => 1, "question_id" => 1, "answer_index" => 0 }
      ]

      result = test_record.grade(answers)

      expect(result[:score]).to eq(2)
      expect(result[:total]).to eq(3)
      expect(result[:passed]).to be(true)
      expect(result[:per_section]).to eq([
        { name: "Ngữ pháp", correct: 2, total: 2 },
        { name: "Ngữ pháp", correct: 0, total: 1 }
      ])
    end
  end

  describe "#sections_with_answers" do
    let(:answers) do
      [
        { "section_index" => 0, "question_id" => 1, "answer_index" => 1 },
        { "section_index" => 1, "question_id" => 1, "answer_index" => 0 }
      ]
    end

    it "attributes each answer to its own section even when sections are identical" do
      annotated = test_record.sections_with_answers(answers)

      expect(annotated[0]["questions"].map { |q| q["your_answer_index"] }).to eq([ 1, nil ])
      expect(annotated[1]["questions"].map { |q| q["your_answer_index"] }).to eq([ 0 ])
    end

    it "leaves unanswered questions nil rather than defaulting them to option 0" do
      annotated = test_record.sections_with_answers([])

      indices = annotated.flat_map { |s| s["questions"].map { |q| q["your_answer_index"] } }
      expect(indices).to all(be_nil)
    end

    it "keeps the answer_index and explanation the show endpoint withholds" do
      annotated = test_record.sections_with_answers(answers)

      expect(annotated[0]["questions"].first).to include("answer_index" => 0)
    end
  end
end
