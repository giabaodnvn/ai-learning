# frozen_string_literal: true

module Prompts
  class ConversationTutorPrompt
    ROLE_DESCRIPTIONS = {
      "free_talk"   => "a friendly Japanese conversation partner",
      "interview"   => "a Japanese job interviewer conducting a formal interview",
      "debate"      => "a Japanese debate opponent arguing the opposite position",
      "story"       => "a Japanese storyteller collaboratively building a story",
      "shopping"    => "a Japanese shop assistant in a retail store",
      "travel"      => "a Japanese hotel receptionist or tour guide"
    }.freeze

    KANJI_GUIDANCE = {
      "n5" => "Use only the simplest kanji (N5 level). Add furigana to ALL kanji. Keep sentences very short.",
      "n4" => "Use N4 kanji and below. Add furigana to N3+ kanji. Keep sentences simple.",
      "n3" => "Use N3 kanji and below. Add furigana only for N2+ kanji. Medium-length sentences are fine.",
      "n2" => "Use N2 kanji and below. Furigana only for uncommon kanji. Natural sentence length.",
      "n1" => "Use natural, native-level Japanese with no furigana restrictions."
    }.freeze

    # Returns a system prompt string for the conversation tutor.
    # `history` is an array of {role:, content:} hashes (may be empty for first turn).
    def self.build(role:, user_level:, history: [])
      role_desc     = ROLE_DESCRIPTIONS.fetch(role.to_s, ROLE_DESCRIPTIONS["free_talk"])
      kanji_guide   = KANJI_GUIDANCE.fetch(user_level.to_s.downcase, KANJI_GUIDANCE["n5"])
      history_block = format_history(history)

      <<~PROMPT
        You are #{role_desc}.
        You are speaking with a Vietnamese learner of Japanese at JLPT #{user_level.upcase} level.

        ## Language rules
        - ALWAYS respond in Japanese. Never switch to Vietnamese or English mid-conversation.
        - #{kanji_guide}
        - Keep your responses conversational and appropriately concise for the role.
        - If the user makes a grammar or vocabulary error, gently continue the conversation
          naturally — do NOT interrupt with corrections in the main response.

        ## After EVERY response, append this exact JSON block on a new line:
        ```json
        {
          "corrections": [
            {
              "original": "the user's incorrect phrase",
              "corrected": "correct Japanese",
              "explanation_vi": "giải thích ngắn bằng tiếng Việt"
            }
          ],
          "new_words": [
            {
              "word": "新しい単語",
              "reading": "あたらしいたんご",
              "meaning_vi": "nghĩa tiếng Việt"
            }
          ]
        }
        ```
        - "corrections" lists errors found in the user's LAST message (empty array if none).
        - "new_words" lists up to 3 notable words you used that may be new for #{user_level.upcase}.
        - This JSON block must appear after your Japanese response, separated by a blank line.

        #{history_block}
      PROMPT
    end

    def self.format_history(history)
      return "" if history.blank?

      lines = history.last(10).map do |msg|
        "#{msg[:role] == 'user' ? 'User' : 'Assistant'}: #{msg[:content]}"
      end

      "## Conversation so far\n#{lines.join("\n")}"
    end
    private_class_method :format_history
  end
end
