// Single source of truth for the VIP tiers (levels 0–3, matching the backend's
// User::VIP_LEVELS). The labels used to live in two places — the profile page
// and the header menu — with the classes drifting between them.

export interface VipTier {
  level: number;
  label: string;
  /** One-line description, shown on the profile page's plan list. */
  desc: string;
  /** Light badge, on white backgrounds. */
  badgeClass: string;
  /** Gradient for the profile page's plan card header. */
  headerClass: string;
  borderClass: string;
  /** Translucent badge, for the dark app header. */
  headerBadgeClass: string;
}

export const VIP_TIERS: VipTier[] = [
  {
    level: 0,
    label: "Free",
    desc: "Truy cập các tính năng học tập cơ bản.",
    badgeClass: "bg-zinc-100 text-zinc-700",
    headerClass: "from-zinc-700 to-zinc-500",
    borderClass: "border-zinc-200",
    headerBadgeClass: "bg-white/10 text-indigo-200",
  },
  {
    level: 1,
    label: "Basic",
    desc: "Mở khóa thêm bài tập và lịch sử học tập.",
    badgeClass: "bg-blue-100 text-blue-700",
    headerClass: "from-blue-700 to-blue-500",
    borderClass: "border-blue-200",
    headerBadgeClass: "bg-blue-500/30 text-blue-200",
  },
  {
    level: 2,
    label: "Pro",
    desc: "AI không giới hạn, tất cả bài kiểm tra cấp độ.",
    badgeClass: "bg-purple-100 text-purple-700",
    headerClass: "from-purple-700 to-violet-500",
    borderClass: "border-purple-200",
    headerBadgeClass: "bg-purple-500/30 text-purple-200",
  },
  {
    level: 3,
    label: "Premium",
    desc: "Toàn quyền truy cập, ưu tiên hỗ trợ.",
    badgeClass: "bg-amber-100 text-amber-700",
    headerClass: "from-amber-600 to-orange-400",
    borderClass: "border-amber-200",
    headerBadgeClass: "bg-amber-500/30 text-amber-200",
  },
];

/** Tier for a level, falling back to Free for an unknown value. */
export function vipTier(level: number | undefined): VipTier {
  return VIP_TIERS[level ?? 0] ?? VIP_TIERS[0];
}
