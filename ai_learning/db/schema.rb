# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_03_26_000001) do
  create_table "conversation_sessions", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "role", null: false
    t.string "jlpt_level", null: false
    t.json "messages"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["jlpt_level"], name: "index_conversation_sessions_on_jlpt_level"
    t.index ["user_id", "created_at"], name: "index_conversation_sessions_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_conversation_sessions_on_user_id"
  end

  create_table "grammar_points", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "pattern", null: false
    t.text "explanation_vi", null: false
    t.string "jlpt_level", null: false
    t.json "examples"
    t.text "notes_vi"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["jlpt_level"], name: "index_grammar_points_on_jlpt_level"
    t.index ["pattern"], name: "index_grammar_points_on_pattern"
  end

  create_table "kanjis", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "character", null: false
    t.json "onyomi"
    t.json "kunyomi"
    t.string "meaning_vi", null: false
    t.string "jlpt_level", default: "n5", null: false
    t.integer "stroke_count"
    t.json "vocab_examples"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["character"], name: "index_kanjis_on_character", unique: true
    t.index ["jlpt_level"], name: "index_kanjis_on_jlpt_level"
  end

  create_table "reading_passages", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.text "content", null: false
    t.string "jlpt_level", null: false
    t.string "topic"
    t.json "questions"
    t.boolean "ai_generated", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ai_generated"], name: "index_reading_passages_on_ai_generated"
    t.index ["jlpt_level", "topic"], name: "index_reading_passages_on_jlpt_level_and_topic"
    t.index ["jlpt_level"], name: "index_reading_passages_on_jlpt_level"
  end

  create_table "user_vocabulary_progresses", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "vocabulary_id", null: false
    t.integer "interval", default: 1, null: false
    t.decimal "ease_factor", precision: 4, scale: 2, default: "2.5", null: false
    t.integer "repetitions", default: 0, null: false
    t.date "due_date", null: false
    t.datetime "last_reviewed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "due_date"], name: "index_user_vocabulary_progresses_on_user_id_and_due_date"
    t.index ["user_id", "vocabulary_id"], name: "index_uvp_on_user_id_and_vocabulary_id", unique: true
    t.index ["user_id"], name: "index_user_vocabulary_progresses_on_user_id"
    t.index ["vocabulary_id"], name: "index_user_vocabulary_progresses_on_vocabulary_id"
  end

  create_table "users", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "role"
    t.string "jti", default: "", null: false
    t.string "name"
    t.string "jlpt_level", default: "n5", null: false
    t.integer "streak_count", default: 0, null: false
    t.datetime "last_studied_at"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jlpt_level"], name: "index_users_on_jlpt_level"
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "vocabularies", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "word", null: false
    t.string "reading", null: false
    t.string "romaji"
    t.text "meaning_vi", null: false
    t.string "jlpt_level", null: false
    t.string "part_of_speech"
    t.json "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["jlpt_level"], name: "index_vocabularies_on_jlpt_level"
    t.index ["part_of_speech"], name: "index_vocabularies_on_part_of_speech"
    t.index ["word"], name: "index_vocabularies_on_word"
  end

  add_foreign_key "conversation_sessions", "users"
  add_foreign_key "user_vocabulary_progresses", "users"
  add_foreign_key "user_vocabulary_progresses", "vocabularies"
end
