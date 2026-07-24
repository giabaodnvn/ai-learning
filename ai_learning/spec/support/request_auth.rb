# frozen_string_literal: true

# Shared helper for request specs: builds a Bearer JWT header for a user,
# matching how the app authenticates (Warden JWT + JTIMatcher).
module RequestAuth
  def auth_headers(user)
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    { "Authorization" => "Bearer #{token}" }
  end
end
