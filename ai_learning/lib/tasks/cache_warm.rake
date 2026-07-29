# frozen_string_literal: true

# The key layout, the TTL and the JSON extraction all belong to
# AiCacheService / AiJson — this task must not carry its own copies, or a warmed
# entry stops matching what GrammarPointsController#generate_exercise reads.
namespace :cache do
  desc "Pre-warm AI exercise cache for top 50 grammar points (all JLPT levels)"
  task warm_grammar: :environment do
    redis   = AppRedis.current
    levels  = JlptLeveled::JLPT_LEVELS
    points  = GrammarPoint.order(:id).limit(50)
    total   = points.count * levels.size
    warmed  = 0
    skipped = 0

    puts "Warming exercise cache for #{points.count} grammar points × #{levels.size} levels = #{total} entries..."

    points.each do |point|
      levels.each do |level|
        cache_key = AiCacheService.namespaced_key("grammar_exercise", point.id, level)

        if redis.exists?(cache_key) == 1
          skipped += 1
          next
        end

        begin
          parsed = AiJson.complete(
            prompt:  Prompts::ExerciseGeneratorPrompt.build(
              pattern:        point.pattern,
              explanation_vi: point.explanation_vi,
              user_level:     level
            ),
            feature: "grammar_exercise_warm",
            user_id: nil
          )
          redis.setex(cache_key, AiCacheService::EXERCISE_TTL, parsed.to_json)
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
    redis = AppRedis.current
    keys  = redis.keys(AiCacheService.namespaced_key("grammar_exercise", "*"))
    redis.del(*keys) if keys.any?
    puts "Cleared #{keys.size} grammar exercise cache entries."
  end
end
