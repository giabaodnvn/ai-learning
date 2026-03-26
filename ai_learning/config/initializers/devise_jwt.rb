Devise::JWT.configure do |config|
  config.secret = ENV.fetch("DEVISE_JWT_SECRET_KEY", Rails.application.credentials.secret_key_base)
  config.dispatch_requests = []
  config.revocation_requests = []
  config.expiration_time = 1.day.to_i
end
