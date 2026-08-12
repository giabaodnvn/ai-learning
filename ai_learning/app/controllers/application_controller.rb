class ApplicationController < ActionController::API
  include Devise::Controllers::Helpers

  # `params.require` is used by 25 actions. Unhandled, Rails maps the resulting
  # ParameterMissing to a 400 whose body is the framework's error *page* — HTML,
  # with no `error` key — so a client that reads the standard envelope shows
  # nothing at all for the commonest client mistake. Answer in the same shape as
  # every other 4xx, keeping the 400 status.
  rescue_from ActionController::ParameterMissing, with: :render_missing_param

  private

  def render_missing_param(error)
    render json: { error: "Thiếu tham số: #{error.param}", errors: [ "Thiếu tham số: #{error.param}" ] },
           status: :bad_request
  end

  def render_unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def render_forbidden(message = "Forbidden")
    render json: { error: message }, status: :forbidden
  end

  def render_not_found(resource = "Resource")
    render json: { error: "#{resource} not found" }, status: :not_found
  end

  # One envelope for every 422 in the app: `error` is always a single string
  # (what a client puts in a banner) and `errors` always the full list (what the
  # profile / register forms iterate over). Before this, each call site picked
  # one key or the other — two actions in the same controller disagreed — so a
  # client had to try both.
  def render_unprocessable(errors)
    list = Array(errors)
    render json: { error: list.join(" "), errors: list }, status: :unprocessable_content
  end

  # A single param failed validation. `name` is the param as the client sent it,
  # so the message points at what to fix.
  def render_invalid_param(name)
    render_unprocessable("#{name} không hợp lệ")
  end

  # The user JSON the four auth endpoints (sign-in, sign-up, profile show and
  # update) all return under `data`. Each spelled out the same walk into the
  # JSON:API envelope.
  def user_attributes(user)
    UserSerializer.new(user).serializable_hash[:data][:attributes]
  end
end
