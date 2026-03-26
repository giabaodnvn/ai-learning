FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user\#{n}@example.com" }
    password              { "password123" }
    password_confirmation { "password123" }
    name                  { Faker::Name.name }
    jlpt_level            { "n5" }
    jti                   { SecureRandom.uuid }
  end
end
