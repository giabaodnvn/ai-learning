class Rack::Attack
  AI_PATHS = %w[/api/v1/conversation /api/v1/vocabulary /api/v1/grammar /api/v1/reading].freeze

  # Throttle all requests by IP (60 per minute)
  throttle("req/ip", limit: 60, period: 1.minute) do |req|
    req.ip
  end

  # Throttle login attempts by IP (5 per 20 seconds)
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/auth/sign_in" && req.post?
  end

  # Throttle login attempts by email (5 per 20 seconds)
  throttle("logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/v1/auth/sign_in" && req.post?
      req.params.dig("user", "email").to_s.downcase.gsub(/\s+/, "").presence
    end
  end

  # Throttle AI endpoints: 20 requests/minute per authenticated user
  throttle("ai/user", limit: 20, period: 1.minute) do |req|
    next unless AI_PATHS.any? { |prefix| req.path.start_with?(prefix) }

    token = req.get_header("HTTP_AUTHORIZATION")&.split(" ")&.last
    next unless token

    begin
      payload = JWT.decode(
        token,
        ENV.fetch("DEVISE_JWT_SECRET_KEY"),
        true,
        algorithms: [ "HS256" ]
      ).first
      payload["sub"]
    rescue JWT::DecodeError
      nil
    end
  end

  # Return 429 JSON response on throttle
  self.throttled_responder = lambda do |env|
    [
      429,
      { "Content-Type" => "application/json" },
      [ { error: "Too many requests. Please try again later." }.to_json ]
    ]
  end
end
