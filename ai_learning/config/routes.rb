require "sidekiq/web"

Rails.application.routes.draw do
  mount Sidekiq::Web => "/sidekiq"

  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Auth
      devise_for :users,
        path: "auth",
        path_names: {
          sign_in: "sign_in",
          sign_out: "sign_out",
          registration: "sign_up"
        },
        controllers: {
          sessions: "api/v1/auth/sessions",
          registrations: "api/v1/auth/registrations"
        },
        defaults: { format: :json }

      namespace :auth do
        get "me", to: "profiles#show"
        post "sign_out", to: "sessions#destroy"
      end

      # AI features
      post "vocabulary/explain",  to: "vocabulary#explain"
      post "grammar/check",       to: "grammar#check"
      post "conversation/chat",   to: "conversation#chat"   # legacy stateless endpoint
      post "reading/generate",    to: "reading#generate"

      # Reading passages (REST + cache-first + word lookup)
      resources :reading_passages, only: [:index, :show] do
        collection do
          post :generate
        end
        member do
          post :answer
          get  :word_lookup
        end
      end

      # Dashboard + gamification
      get  "dashboard",               to: "dashboard#index"
      get  "dashboard/weekly_report", to: "dashboard#weekly_report"

      get  "review/queue",        to: "review#queue"
      post "review/submit",       to: "review#submit"

      # Conversation sessions (REST + SSE)
      resources :conversations, only: [:index, :create, :show, :destroy] do
        member do
          post :send_message
        end
      end

      # Vocabulary list + SSE explain
      get  "vocabularies",                      to: "vocabulary#index"
      get  "vocabularies/:id/explain",          to: "vocabulary#explain_by_id"

      # Grammar points CRUD + AI actions
      resources :grammar_points, only: [:index, :show] do
        member do
          post :check_sentence
          post :generate_exercise
          post :ask
        end
      end

      # Flashcard / SRS  (universal — vocabulary + kanji + grammar_point)
      get  "flashcards/due",                    to: "flashcards#due"
      get  "flashcards/new",                    to: "flashcards#new_cards"
      post "flashcards/review",                 to: "flashcards#review"
      post "flashcards/:vocab_id/review",       to: "flashcards#review_legacy"

      # Flashcard — Learn mode (random pick + quiz)
      get  "flashcards/random",                 to: "flashcards#random"
      post "flashcards/quiz",                   to: "flashcards#generate_quiz"
      post "flashcards/status",                 to: "flashcards#update_status"
      post "flashcards/status/bulk",            to: "flashcards#bulk_update_status"
    end
  end
end
