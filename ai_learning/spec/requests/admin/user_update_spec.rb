# frozen_string_literal: true

require "rails_helper"

# `role` is the one editable attribute here that grants privilege, so its
# handling is pinned separately from the rest of the form.
RSpec.describe "PATCH /admin/users/:id", type: :request do
  let!(:admin)   { create_admin }
  let!(:student) { FactoryBot.create(:user, name: "Cũ", jlpt_level: "n5") }

  before { sign_in_admin(admin) }

  def update_student(attrs)
    patch admin_user_path(student), params: { user: attrs }
  end

  it "updates the ordinary attributes" do
    update_student(name: "Mới", jlpt_level: "n3", vip_level: "2")

    expect(response).to redirect_to(admin_user_path(student))
    expect(student.reload).to have_attributes(name: "Mới", jlpt_level: "n3", vip_level: 2)
  end

  it "promotes a user when a valid role is given" do
    update_student(role: "admin")

    expect(student.reload.role).to eq("admin")
  end

  it "leaves the role alone when the param is absent" do
    update_student(name: "Mới")

    expect(student.reload.role).to eq("student")
  end

  # An unknown value would otherwise reach the integer-backed enum and raise
  # ArgumentError — a 500 — before validation could turn it into a form error.
  it "rejects an unknown role with a 422 and changes nothing" do
    update_student(role: "superuser", name: "Mới")

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.body).to include("Role không hợp lệ")
    expect(student.reload).to have_attributes(role: "student", name: "Cũ")
  end

  it "rejects an invalid ordinary attribute with a 422" do
    update_student(jlpt_level: "n9")

    expect(response).to have_http_status(:unprocessable_content)
    expect(student.reload.jlpt_level).to eq("n5")
  end
end
