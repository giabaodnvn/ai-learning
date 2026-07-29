class ReadingPassage < ApplicationRecord
  include AiGeneratedContent

  after_initialize do
    self.questions             ||= []
    self.vocabulary_highlights ||= []
  end

  validates :content, presence: true
end
