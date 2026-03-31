# frozen_string_literal: true

namespace :cache do
  desc "Pre-warm AI exercise cache for top 50 grammar points (all JLPT levels)"
  task warm_grammar: :environment do
    redis   = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
    levels  = GrammarPoint::JLPT_LEVELS
    points  = GrammarPoint.order(:id).limit(50)
    total   = points.count * levels.size
    warmed  = 0
    skipped = 0

    puts "Warming exercise cache for #{points.count} grammar points × #{levels.size} levels = #{total} entries..."

    points.each do |point|
      levels.each do |level|
        cache_key = "grammar_exercise:#{point.id}:#{level}"

        if redis.exists?(cache_key) == 1
          skipped += 1
          next
        end

        begin
          prompt = Prompts::ExerciseGeneratorPrompt.build(
            pattern:        point.pattern,
            explanation_vi: point.explanation_vi,
            user_level:     level
          )
          raw    = ClaudeService.complete(
            prompt:    prompt,
            log_usage: { feature: "grammar_exercise_warm", user_id: nil }
          )
          parsed = extract_json(raw)
          redis.setex(cache_key, 7.days.to_i, parsed.to_json)
          warmed += 1
          print "."
          $stdout.flush
          sleep 0.3  # Avoid hitting Gemini rate limit
        rescue => e
          puts "\n[WARN] #{point.pattern} (#{level}): #{e.message}"
        end
      end
    end

    puts "\nDone. Warmed: #{warmed}, Skipped (already cached): #{skipped}."
  end

  desc "Clear all grammar exercise caches"
  task clear_grammar: :environment do
    redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))
    keys  = redis.keys("grammar_exercise:*")
    redis.del(*keys) if keys.any?
    puts "Cleared #{keys.size} grammar exercise cache entries."
  end

  private

  def extract_json(raw)
    text = raw.to_s
    if (m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i))
      return JSON.parse(m[1].strip)
    end
    start  = text.index("{")
    finish = text.rindex("}")
    return JSON.parse(text[start..finish]) if start && finish
    JSON.parse(text.strip)
  end
end
