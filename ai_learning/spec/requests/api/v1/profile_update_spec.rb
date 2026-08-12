# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PATCH /api/v1/auth/me", type: :request do
  let(:user) { FactoryBot.create(:user, jlpt_level: "n5") }

  it "updates the JLPT level" do
    patch "/api/v1/auth/me", params: { user: { jlpt_level: "n3" } }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(user.reload.jlpt_level).to eq("n3")
  end

  # jlpt_level used to be declared as an ActiveRecord enum on User as well as
  # being validated by JlptLeveled. The enum raised ArgumentError on assignment,
  # so a bad value from this user-facing form produced a 500 before validation
  # ever ran.
  it "rejects an unknown JLPT level with 422 instead of raising" do
    patch "/api/v1/auth/me", params: { user: { jlpt_level: "n9" } }, headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.jlpt_level).to eq("n5")
  end
end
