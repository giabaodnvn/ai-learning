# frozen_string_literal: true

class Rack::Attack
  AI_PATHS = %w[
    /api/v1/conversation
    /api/v1/vocabulary
    /api/v1/grammar
    /api/v1/reading
    /api/v1/reading_passages
  ].freeze

  # ── IP throttles ─────────────────────────────────────────────────────────

  # 200 API requests/min per IP
  throttle("req/ip", limit: 200, period: 1.minute) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # Login: 5 attempts per 20 seconds per IP
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/auth/sign_in" && req.post?
  end

  # Login: 5 attempts per 20 seconds per email
  throttle("logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/api/v1/auth/sign_in" && req.post?
      req.params.dig("user", "email").to_s.downcase.gsub(/\s+/, "").presence
    end
  end

  # ── Per-user AI throttle (by JWT sub claim) ──────────────────────────────

  # 20 AI requests/min per authenticated user
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

  # ── Throttled response with Retry-After + exponential backoff headers ─────

  self.throttled_responder = lambda do |env|
    match_data  = env["rack.attack.match_data"]
    period      = match_data&.dig(:period) || 60
    retry_after = period.to_i

    [
      429,
      {
        "Content-Type"       => "application/json",
        "Retry-After"        => retry_after.to_s,
        "X-RateLimit-Limit"  => match_data&.dig(:limit).to_s,
        "X-RateLimit-Reset"  => (Time.now.to_i + retry_after).to_s
      },
      [ { error: "Too many requests. Retry after #{retry_after} seconds." }.to_json ]
    ]
  end
end
