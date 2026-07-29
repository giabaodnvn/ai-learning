# frozen_string_literal: true

require "rails_helper"

RSpec.describe "User session revocation when credentials change" do
  let!(:user)      { FactoryBot.create(:user) }
  let(:new_secret) { SecureRandom.alphanumeric(12) }

  it "rotates jti when the credential changes" do
    expect { user.update!(password: new_secret, password_confirmation: new_secret) }
      .to change { user.reload.jti }
  end

  it "leaves jti alone when other attributes change" do
    expect { user.update!(name: "Đổi tên") }
      .not_to change { user.reload.jti }
  end

  it "invalidates a JWT issued before the change" do
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    payload = JwtDecoder.decode(token)

    user.update!(password: new_secret, password_confirmation: new_secret)

    expect(User.jwt_revoked?(payload, user.reload)).to be(true)
  end
end
