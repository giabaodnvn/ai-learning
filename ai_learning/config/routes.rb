require "sidekiq/web"

Rails.application.routes.draw do
  # Sidekiq Web UI (admin only in production)
  mount Sidekiq::Web => "/sidekiq"

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  # Auth routes (JWT-based)
  devise_for :users,
    path: "api/v1",
    path_names: {
      sign_in: "users/sign_in",
      sign_out: "users/sign_out",
      registration: "users/sign_up"
    },
    controllers: {
      sessions: "api/v1/users/sessions",
      registrations: "api/v1/users/registrations"
    }

  # API v1
  namespace :api do
    namespace :v1 do
      # Add resources here
    end
  end
end
