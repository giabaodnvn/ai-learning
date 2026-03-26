FactoryBot.define do
  factory :user_vocabulary_progress do
    association :user
    association :vocabulary
    interval    { 1 }
    ease_factor { 2.5 }
    repetitions { 0 }
    due_date    { Date.current }
  end
end
