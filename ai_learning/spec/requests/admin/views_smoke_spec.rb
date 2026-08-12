# frozen_string_literal: true

require "rails_helper"

# The admin panel is server-rendered ERB with no view specs, so a typo in a
# template only showed up in the browser. These render each page for real and
# assert it comes back 200 with its heading — enough to catch a broken helper
# call, a missing local or a renamed instance variable.
RSpec.describe "Admin panel pages", type: :request do
  let!(:admin)   { create_admin }
  let!(:student) { FactoryBot.create(:user, name: "Học viên", jlpt_level: "n3", vip_level: 2) }

  before { sign_in_admin(admin) }

  it "signs the admin in" do
    expect(response).to redirect_to(admin_root_path)
  end

  describe "GET /admin" do
    it "renders the dashboard with the stat cards and recent users" do
      get admin_root_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Tổng user", "Người dùng mới nhất", student.email)
    end
  end

  describe "GET /admin/users" do
    it "renders the user table" do
      get admin_users_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(student.email, "Học viên")
    end

    it "renders the filtered list" do
      get admin_users_path, params: { q: student.email, role: "student", vip: "vip" }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(student.email)
    end
  end

  describe "GET /admin/users/:id" do
    it "renders the detail page" do
      get admin_user_path(student)

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(student.email, "Thao tác nguy hiểm")
    end
  end

  describe "GET /admin/ai_costs" do
    it "renders both ranges" do
      %w[week month].each do |range|
        get admin_ai_costs_path(range: range)

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Chi tiết theo feature")
      end
    end
  end

  describe "GET /admin/account/edit" do
    it "renders the password form" do
      get edit_admin_account_path

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Đổi mật khẩu", admin.email)
    end
  end
end
