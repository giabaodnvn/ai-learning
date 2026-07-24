# frozen_string_literal: true

require "jwt"

# Decodes Devise-JWT tokens in the one place that knows the secret + algorithm.
# Previously this HS256 decode was copy-pasted across BaseController, the
# sign-out action and the Rack::Attack throttle.
class JwtDecoder
  ALGORITHM = "HS256"

  # Returns the token payload hash. Raises JWT::DecodeError (or a subclass such
  # as JWT::ExpiredSignature) when the token is missing, malformed or expired.
  def self.decode(token)
    JWT.decode(token, secret, true, algorithms: [ ALGORITHM ]).first
  end

  # Best-effort variant for contexts where an invalid token should simply not
  # identify a user (e.g. rate limiting) rather than raise.
  def self.decode_safe(token)
    return nil if token.blank?

    decode(token)
  rescue JWT::DecodeError
    nil
  end

  # Must resolve to the SAME secret the tokens are signed with in
  # config/initializers/devise_jwt.rb, otherwise every authenticated request
  # would fail to verify. Keep the fallback in lockstep with that file.
  def self.secret
    ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.secret_key_base }
  end
  private_class_method :secret
end
