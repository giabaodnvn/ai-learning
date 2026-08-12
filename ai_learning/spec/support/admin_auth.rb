# frozen_string_literal: true

# Signing in to the HTML admin panel, which uses a session cookie rather than
# the JWT that RequestAuth builds for the API.
#
# Three admin specs each rolled their own: two hardcoded "password123" (a
# second copy of the factory's secret, so changing the factory would have
# broken them for no reason) and the third posted to a literal "/admin/login"
# instead of the route helper.
module AdminAuth
  # The factory's password, read from the factory rather than repeated here.
  def factory_password
    @factory_password ||= FactoryBot.build(:user).password
  end

  def create_admin(**attrs)
    FactoryBot.create(:user, role: :admin, **attrs)
  end

  # Establishes the admin session for subsequent requests in the example.
  def sign_in_admin(admin, password: factory_password)
    post admin_login_path, params: { email: admin.email, password: password }
  end
end
