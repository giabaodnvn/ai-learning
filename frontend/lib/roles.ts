// Single source of truth for conversation role metadata. Previously the role
// list (with descriptions) lived in the conversation index page and a separate
// label/icon map was duplicated in the chat page.

export interface ConversationRole {
  value: string;
  label: string;
  icon: string;
  desc: string;
}

export const CONVERSATION_ROLES: ConversationRole[] = [
  { value: "tutor",                   label: "Gia sư tiếng Nhật",     icon: "👩‍🏫", desc: "Luyện tập tự do với gia sư kiên nhẫn" },
  { value: "convenience_store_clerk", label: "Cửa hàng tiện lợi",     icon: "🏪", desc: "Mua sắm tại コンビニ Nhật Bản" },
  { value: "restaurant_staff",        label: "Nhà hàng Nhật",         icon: "🍜", desc: "Đặt bàn, gọi món tại nhà hàng" },
  { value: "office_colleague",        label: "Đồng nghiệp văn phòng", icon: "💼", desc: "Giao tiếp nơi làm việc tại Nhật" },
  { value: "hotel_staff",             label: "Khách sạn",             icon: "🏨", desc: "Check-in, hỏi thông tin tại khách sạn" },
  { value: "airport_staff",           label: "Sân bay",               icon: "✈️", desc: "Làm thủ tục, hỏi đường tại sân bay" },
];

/** value → { label, icon } lookup, derived from CONVERSATION_ROLES. */
export const ROLE_META: Record<string, { label: string; icon: string }> =
  Object.fromEntries(CONVERSATION_ROLES.map((r) => [r.value, { label: r.label, icon: r.icon }]));
