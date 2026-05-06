# frozen_string_literal: true

class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :email, :jlpt_level, :role, :streak_count,
             :last_studied_at, :created_at, :vip_level, :vip_expires_at, :balance

  attribute :vip_active do |user|
    user.vip_active?
  end
end
