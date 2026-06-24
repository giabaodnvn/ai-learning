# frozen_string_literal: true

module Admin
  class UsersController < Admin::BaseController
    before_action :set_user, only: [:show, :update, :toggle_block, :reset_vip, :reset_password]

    # GET /admin/users
    def index
      @q      = params[:q].to_s.strip
      @role   = params[:role].presence
      @vip    = params[:vip].presence
      @page   = [params[:page].to_i, 1].max
      per     = 20

      scope = User.all
      scope = scope.where("email LIKE ? OR name LIKE ?", "%#{@q}%", "%#{@q}%") if @q.present?
      scope = scope.where(role: @role)      if @role.present?
      scope = scope.where("vip_level > 0")  if @vip == "vip"
      scope = scope.where(blocked: true)    if @vip == "blocked"

      @total = scope.count
      @users = scope.order(created_at: :desc).offset((@page - 1) * per).limit(per)
      @pages = (@total.to_f / per).ceil
    end

    # GET /admin/users/:id
    def show
      load_show_data
    end

    # PATCH /admin/users/:id
    def update
      allowed = params.require(:user).permit(:role, :jlpt_level, :vip_level, :balance, :vip_expires_at, :name)

      if @user.update(allowed)
        redirect_to admin_user_path(@user), notice: "Cập nhật thành công."
      else
        flash.now[:alert] = @user.errors.full_messages.to_sentence
        load_show_data
        render :show, status: :unprocessable_entity
      end
    end

    # PATCH /admin/users/:id/toggle_block
    def toggle_block
      if @user == current_admin
        return redirect_to admin_user_path(@user), alert: "Không thể tự khóa tài khoản của mình."
      end

      @user.update_column(:blocked, !@user.blocked)
      status = @user.blocked? ? "khóa" : "mở khóa"
      redirect_to admin_user_path(@user), notice: "Đã #{status} tài khoản #{@user.email}."
    end

    # DELETE /admin/users/:id/reset_vip
    def reset_vip
      @user.update_columns(vip_level: 0, vip_expires_at: nil)
      redirect_to admin_user_path(@user), notice: "Đã reset VIP cho #{@user.email}."
    end

    # POST /admin/users/:id/reset_password
    # Generates a temporary password, saves it, and emails it to the user.
    def reset_password
      temp = SecureRandom.alphanumeric(10)
      if @user.update(password: temp)
        UserMailer.password_reset_by_admin(@user, temp).deliver_later
        redirect_to admin_user_path(@user), notice: "Đã đặt lại mật khẩu và gửi email tới #{@user.email}."
      else
        redirect_to admin_user_path(@user), alert: @user.errors.full_messages.to_sentence
      end
    end

    private

    def set_user
      @user = User.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      redirect_to admin_users_path, alert: "Không tìm thấy user."
    end

    def load_show_data
      @study_logs = @user.study_logs.order(studied_on: :desc).limit(14)
      @ai_logs    = AiUsageLog.where(user_id: @user.id).order(created_at: :desc).limit(10)
      @card_stats = {
        total:   @user.user_card_progresses.count,
        learned: @user.user_card_progresses.where(learned: true).count,
        due:     @user.user_card_progresses.where("due_date <= ?", Date.current).count
      }
    end
  end
end
