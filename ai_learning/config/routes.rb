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
    end
  end
end
