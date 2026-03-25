class Rack::Attack
  # Throttle all requests by IP (60 per minute)
  throttle("req/ip", limit: 60, period: 1.minute) do |req|
    req.ip
  end

  # Throttle login attempts by IP (5 per 20 seconds)
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/users/sign_in" && req.post?
  end

  # Throttle login attempts by email (5 per 20 seconds)
  throttle("logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/v1/users/sign_in" && req.post?
      req.params.dig("user", "email").to_s.downcase.gsub(/\s+/, "").presence
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
