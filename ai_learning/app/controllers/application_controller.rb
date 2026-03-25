class ApplicationController < ActionController::API
  before_action :authenticate_user!

  private

  def current_user
    super
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def render_not_found(resource = "Resource")
    render json: { error: "#{resource} not found" }, status: :not_found
  end

  def render_unprocessable(errors)
    render json: { errors: errors }, status: :unprocessable_entity
  end
end
