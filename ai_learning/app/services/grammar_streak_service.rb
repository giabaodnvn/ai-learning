# frozen_string_literal: true

# Per-user, per-grammar-point practice streak, stored in Redis.
#
# A streak is a JSON blob `{count:, last_date:}` under
# "grammar_streak:<user_id>:<point_id>", expiring after 30 days of inactivity —
# long enough that a lapsed streak has already been broken by then.
class GrammarStreakService
  TTL = 30 * 24 * 3600 # 30 days

  EMPTY = { count: 0, last_date: nil }.freeze

  def initialize(user_id, point_id)
    @key = "grammar_streak:#{user_id}:#{point_id}"
  end

  # Current streak, without recording a practice. Returns EMPTY when the key is
  # absent or holds an unreadable value.
  def read
    raw = redis.get(key)
    return EMPTY.dup unless raw

    JSON.parse(raw, symbolize_names: true)
  rescue JSON::ParserError
    EMPTY.dup
  end

  # Record a practice for today and return the updated streak.
  # Practising twice in one day leaves the count unchanged; a gap resets it.
  def record!
    today   = Date.current.to_s
    current = read

    count = case current[:last_date]
    when today                       then current[:count]      # already practised today
    when (Date.current - 1).to_s     then current[:count] + 1  # consecutive day
    else                                  1                    # first practice, or streak broken
    end

    { count: count, last_date: today }.tap do |streak|
      redis.setex(key, TTL, streak.to_json)
    end
  end

  private

  attr_reader :key

  def redis
    AppRedis.current
  end
end
