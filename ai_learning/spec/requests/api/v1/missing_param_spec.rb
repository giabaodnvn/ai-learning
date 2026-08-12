# frozen_string_literal: true

require "rails_helper"

# Locks the contract for a request that omits a `params.require` param.
#
# Before the shared handler, ParameterMissing fell through to Rails' own
# rescue_responses: still a 400, but the body was the framework error *page*
# (text/html, no `error` key), so a client reading the standard envelope had
# nothing to show for the commonest client-side mistake.
RSpec.describe "Api::V1 missing required params", type: :request do
  let(:user) { FactoryBot.create(:user) }

  shared_examples "a missing-param 400" do |param|
    it "returns 400 with the standard JSON error envelope naming #{param}" do
      perform

      expect(response).to have_http_status(:bad_request)
      expect(response.media_type).to eq("application/json")

      body = JSON.parse(response.body)
      expect(body["error"]).to include(param)
      expect(body["errors"]).to eq([ body["error"] ])
    end
  end

  describe "POST /api/v1/reading_passages/generate without :topic" do
    let(:perform) { post "/api/v1/reading_passages/generate", params: {}, headers: auth_headers(user) }

    include_examples "a missing-param 400", "topic"
  end

  describe "POST /api/v1/flashcards/review without :grade" do
    let(:perform) do
      post "/api/v1/flashcards/review",
           params: { card_type: "vocabulary", card_id: 1 }, headers: auth_headers(user)
    end

    include_examples "a missing-param 400", "grade"
  end

  # Not a BaseController descendant: it inherits Devise's controller, which is
  # what makes ApplicationController the right home for the handler.
  describe "POST /api/v1/auth/sign_up without :user" do
    let(:perform) { post "/api/v1/auth/sign_up", params: {} }

    include_examples "a missing-param 400", "user"
  end
end
