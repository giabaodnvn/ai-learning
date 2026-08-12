# frozen_string_literal: true

class Rack::Attack
  # The endpoints that can trigger a Gemini call, and so spend a slot in the
  # per-user AI budget below.
  #
  # This was a list of path *prefixes*, three of which named routes that had
  # already been deleted (/api/v1/conversation, /api/v1/grammar,
  # /api/v1/reading — see the note in config/routes.rb). They kept working only
  # because `start_with?` made each a prefix of the resource that replaced it,
  # which also dragged in every sibling read: browsing the grammar list and
  # opening nine grammar points is 19 requests against a 20/minute AI budget,
  # so ordinary reading could 429 without a single AI call being made.
  #
  # Matching the whole path instead confines the budget to endpoints that
  # actually cost tokens. The reads that dropped out are still covered by the
  # 200/minute `req/ip` throttle above.
  #
  # spec/requests/rack_attack_ai_paths_spec.rb checks this against the real
  # route table, so an AI endpoint added without being listed here fails.
  AI_ENDPOINTS = %r{
    \A/api/v1/(?:
        vocabulary/explain
      | vocabularies/\d+/explain
      | writing/feedback
      | reading_passages (?: /generate | /\d+/word_lookup )?     # index generates when the level is empty
      | listening_exercises (?: /generate )?                     # ditto
      | level_tests/generate
      | conversations/\d+/send_message
      | grammar_points/\d+/(?: check_sentence | generate_exercise | ask | generate_set )
    )
    (?:\.[A-Za-z0-9]+)? /? \z
  }x

  # Allow all requests from localhost / Docker internal network in development
  safelist("allow-localhost") do |req|
    Rails.env.development? &&
      (req.ip == "127.0.0.1" || req.ip == "::1" || req.ip.start_with?("172.") || req.ip.start_with?("192.168."))
  end

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

  # Admin login (session-based, highest-privilege): 5 attempts per 20s per IP
  throttle("admin-logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/admin/login" && req.post?
  end

  # Admin login: 5 attempts per 20 seconds per email
  throttle("admin-logins/email", limit: 5, period: 20.seconds) do |req|
    if req.path == "/admin/login" && req.post?
      req.params["email"].to_s.downcase.gsub(/\s+/, "").presence
    end
  end

  # ── Per-user AI throttle (by JWT sub claim) ──────────────────────────────

  # 20 AI requests/min per authenticated user
  throttle("ai/user", limit: 20, period: 1.minute) do |req|
    next unless AI_ENDPOINTS.match?(req.path)

    token = req.get_header("HTTP_AUTHORIZATION")&.split(" ")&.last
    JwtDecoder.decode_safe(token)&.dig("sub")
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
