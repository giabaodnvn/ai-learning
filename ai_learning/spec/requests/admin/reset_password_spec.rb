# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin reset user password", type: :request do
  include ActiveJob::TestHelper

  # FactoryBot :user secret, read without hardcoding a literal.
  let(:known_secret) { FactoryBot.build(:user).password }
  let(:admin)  { FactoryBot.create(:user, role: :admin, email: "adm-#{SecureRandom.hex(6)}@example.com") }
  let(:target) { FactoryBot.create(:user, email: "tgt-#{SecureRandom.hex(6)}@example.com") }

  def login_admin
    post "/admin/login", params: { email: admin.email, password: known_secret }
  end

  describe "POST /admin/users/:id/reset_password" do
    it "changes the user's password and enqueues the notification email" do
      login_admin
      old_digest = target.encrypted_password

      expect {
        post "/admin/users/#{target.id}/reset_password"
      }.to have_enqueued_mail(UserMailer, :password_reset_by_admin)

      expect(response).to have_http_status(:found)
      target.reload
      expect(target.encrypted_password).not_to eq(old_digest)
      expect(target.valid_password?(known_secret)).to be false
    end

    it "redirects to login when not authenticated as admin" do
      post "/admin/users/#{target.id}/reset_password"
      expect(response).to redirect_to(admin_login_path)
    end
  end
end
