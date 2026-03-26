# frozen_string_literal: true

class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :email, :jlpt_level, :role, :streak_count, :last_studied_at, :created_at
end
