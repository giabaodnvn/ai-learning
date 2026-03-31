module AdminHelper
  def stat_card(label, value, color = "blue")
    content_tag(:div, class: "bg-white rounded-xl border border-gray-200 p-5") do
      content_tag(:p, label, class: "text-xs font-medium text-gray-500 mb-1") +
      content_tag(:p, number_with_delimiter(value), class: "text-3xl font-bold text-#{color}-600")
    end
  end

  def nav_link(label, path)
    active = request.path.start_with?(path) && path != admin_root_path ||
             request.path == path
    cls = active ? "bg-brand-700 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
    link_to label, path, class: "flex items-center gap-2 rounded-lg px-3 py-2 text-sm #{cls} transition"
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
