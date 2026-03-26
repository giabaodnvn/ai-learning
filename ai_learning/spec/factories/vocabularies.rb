FactoryBot.define do
  factory :vocabulary do
    sequence(:word)    { |n| "単語#{n}" }
    sequence(:reading) { |n| "たんご#{n}" }
    meaning_vi  { Faker::Lorem.words(number: 3).join(" ") }
    jlpt_level  { "n5" }
    part_of_speech { "noun" }
  end
end
