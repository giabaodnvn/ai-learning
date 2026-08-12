# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Auth password change", type: :request do
  def auth_headers(user)
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    { "Authorization" => "Bearer #{token}" }
  end

  let(:user)       { FactoryBot.create(:user) }
  # Read the factory's secret without hardcoding a literal.
  let(:current_pw) { FactoryBot.build(:user).password }
  let(:new_pw)     { "N" + SecureRandom.alphanumeric(9) }

  describe "PATCH /api/v1/auth/password" do
    it "changes the secret when current one is correct" do
      patch "/api/v1/auth/password",
            params: { current_password: current_pw, new_password: new_pw },
            headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(user.reload.valid_password?(new_pw)).to be true
    end

    it "rejects a wrong current secret" do
      patch "/api/v1/auth/password",
            params: { current_password: SecureRandom.uuid, new_password: new_pw },
            headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(user.reload.valid_password?(current_pw)).to be true
    end

    it "rejects a too-short new secret" do
      patch "/api/v1/auth/password",
            params: { current_password: current_pw, new_password: "x" * 3 },
            headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "requires authentication" do
      patch "/api/v1/auth/password",
            params: { current_password: current_pw, new_password: new_pw }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
