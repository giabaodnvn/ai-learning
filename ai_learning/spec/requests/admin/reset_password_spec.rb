# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin reset user password", type: :request do
  include ActiveJob::TestHelper

  let(:admin)  { create_admin(email: "adm-#{SecureRandom.hex(6)}@example.com") }
  let(:target) { FactoryBot.create(:user, email: "tgt-#{SecureRandom.hex(6)}@example.com") }

  describe "POST /admin/users/:id/reset_password" do
    it "changes the user's password and enqueues the notification email" do
      sign_in_admin(admin)
      old_digest = target.encrypted_password

      expect {
        post "/admin/users/#{target.id}/reset_password"
      }.to have_enqueued_mail(UserMailer, :password_reset_by_admin)

      expect(response).to have_http_status(:found)
      target.reload
      expect(target.encrypted_password).not_to eq(old_digest)
      expect(target.valid_password?(factory_password)).to be false
    end

    it "redirects to login when not authenticated as admin" do
      post "/admin/users/#{target.id}/reset_password"
      expect(response).to redirect_to(admin_login_path)
    end
  end
end
