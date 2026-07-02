module AdminHelper
  def stat_card(label, value, color = "blue")
    content_tag(:div, class: "bg-white rounded-2xl border border-gray-200/70 p-5 shadow-soft transition hover:-translate-y-0.5") do
      content_tag(:p, label, class: "text-xs font-semibold text-gray-500 mb-2") +
      content_tag(:p, number_with_delimiter(value), class: "text-3xl font-display font-bold text-#{color}-600")
    end
  end

  def nav_link(label, path)
    active = request.path.start_with?(path) && path != admin_root_path ||
             request.path == path
    cls = active ? "bg-white/20 text-white ring-1 ring-white/25 shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
    link_to label, path, class: "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium #{cls} transition"
  end

  VIP_LABELS = { 0 => ["Free", "gray"], 1 => ["Basic", "blue"], 2 => ["Pro", "purple"], 3 => ["Premium", "yellow"] }.freeze
  ROLE_LABELS = { "admin" => ["Admin", "red"], "student" => ["Student", "green"] }.freeze

  def vip_badge(level)
    label, color = VIP_LABELS[level.to_i] || ["?", "gray"]
    content_tag(:span, label,
      class: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-#{color}-100 text-#{color}-700")
  end

  def role_badge(role)
    label, color = ROLE_LABELS[role.to_s] || [role, "gray"]
    content_tag(:span, label,
      class: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-#{color}-100 text-#{color}-700")
  end
end
