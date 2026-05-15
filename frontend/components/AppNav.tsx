"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app/dashboard",        label: "Tổng quan",   icon: "🏠" },
  { href: "/app/study/flashcard",  label: "Flashcard",   icon: "🃏" },
  { href: "/app/review",           label: "Ôn tập SRS",  icon: "🔁" },
  { href: "/app/reading",          label: "Đọc hiểu",    icon: "📖" },
  { href: "/app/listening",        label: "Nghe hiểu",   icon: "🎧" },
  { href: "/app/grammar",          label: "Ngữ pháp",    icon: "✏️"  },
  { href: "/app/conversation",     label: "Hội thoại",   icon: "💬" },
  { href: "/app/vocabulary",       label: "Từ điển",     icon: "📚" },
  { href: "/app/kanji",            label: "Chữ Hán",     icon: "漢" },
  { href: "/app/writing",          label: "Luyện viết",  icon: "📝" },
  { href: "/app/level-test",       label: "Kiểm tra",    icon: "🎯" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-white/10 overflow-x-auto scrollbar-none">
      <div className="mx-auto flex max-w-5xl px-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`
                shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                border-b-2 transition-all duration-150 whitespace-nowrap
                ${active
                  ? "border-indigo-300 text-white"
                  : "border-transparent text-indigo-300/70 hover:text-indigo-100 hover:border-indigo-500/50"
                }
              `}
            >
              <span className="text-[13px] leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
