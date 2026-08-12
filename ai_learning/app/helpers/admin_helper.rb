# frozen_string_literal: true

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

  # Only the colour lives here — User::VIP_NAMES owns the labels.
  VIP_COLORS  = { 0 => "gray", 1 => "blue", 2 => "purple", 3 => "yellow" }.freeze
  ROLE_LABELS = { "admin" => [ "Admin", "red" ], "student" => [ "Student", "green" ] }.freeze

  def vip_badge(level)
    badge(User::VIP_NAMES[level.to_i] || "?", VIP_COLORS[level.to_i] || "gray")
  end

  def role_badge(role)
    label, color = ROLE_LABELS[role.to_s] || [ role, "gray" ]
    badge(label, color)
  end

  # The level chip next to vip_badge / role_badge in both user tables. It was
  # the one of the three still written out as raw markup, in two views.
  def jlpt_badge(level)
    content_tag(:span, level, class: "font-mono uppercase text-xs bg-gray-100 px-2 py-0.5 rounded")
  end

  # Selected/unselected pill, shared by the user-list pagination and the
  # AI-cost range switch — three copies of the same two class strings.
  def pill_link(label, url, active:)
    state = if active
      "bg-blue-600 text-white border-blue-600"
    else
      "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    end

    link_to label, url, class: "rounded-lg px-4 py-2 text-sm font-medium border transition #{state}"
  end

  # Field styling, written out at eight call sites before. A text input is the
  # select's styling plus a focus ring; spelling that relationship out is what
  # keeps the two from drifting apart on the same form.
  SELECT_CLASS = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  INPUT_CLASS  = "#{SELECT_CLASS} focus:outline-none focus:ring-2 focus:ring-blue-500"

  # dd/mm/yyyy, the only date format the panel shows.
  def admin_date(time)
    time&.strftime("%d/%m/%Y")
  end

  # Flash strip. Rendered twice per message before — once for the page with the
  # sidebar and once for the login page — so a wording or icon change had to be
  # made in four places.
  def flash_banner(kind, message, position:)
    color, icon = kind.to_sym == :notice ? [ "green", "✓" ] : [ "red", "⚠" ]

    content_tag(:div, "#{icon} #{message}",
      class: "rounded-2xl bg-#{color}-50 border border-#{color}-200 px-4 py-3 " \
             "text-sm text-#{color}-700 shadow-soft #{position}")
  end

  private

  def badge(label, color)
    content_tag(:span, label,
      class: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-#{color}-100 text-#{color}-700")
  end
end
