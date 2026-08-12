# frozen_string_literal: true

require "rails_helper"

# Locks the contract of Api::V1::Concerns::LevelScoped, which replaced the
# per-controller copies of "read params[:level], downcase it, check it against
# the JLPT list". Each controller used to spell one of those three steps
# differently; these examples pin the behaviour the shared helpers must keep.
RSpec.describe "JLPT level params", type: :request do
  let(:user) { FactoryBot.create(:user, jlpt_level: "n4") }

  describe "GET /api/v1/level_tests" do
    it "falls back to the user's own level when no level is given" do
      get "/api/v1/level_tests", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["level"]).to eq("n4")
    end

    it "accepts an uppercase level" do
      get "/api/v1/level_tests", params: { level: "N3" }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["level"]).to eq("n3")
    end

    it "rejects a level outside n5..n1" do
      get "/api/v1/level_tests", params: { level: "n9" }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq("Level không hợp lệ")
    end
  end

  describe "POST /api/v1/conversations" do
    it "rejects a jlpt_level outside n5..n1 before creating a session" do
      expect {
        post "/api/v1/conversations",
             params: { role: "tutor", jlpt_level: "n0" }, headers: auth_headers(user)
      }.not_to change(ConversationSession, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq("jlpt_level không hợp lệ")
    end

    it "rejects a role the prompt configs don't define" do
      post "/api/v1/conversations",
           params: { role: "sumo_wrestler" }, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)["error"]).to eq("role không hợp lệ")
    end
  end

  # The model validated `role` against its own hand-written list while the
  # controller validated against the prompt configs; a role present in one and
  # not the other was accepted at the door and then rejected on save.
  it "derives the session role list from the prompt configs" do
    expect(ConversationSession::ROLES).to eq(Prompts::ConversationTutorPrompt::ROLES)
  end
end
