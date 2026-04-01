"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/app/dashboard",   label: "Tổng quan" },
  { href: "/app/study/flashcard", label: "Học từ vựng" },
  { href: "/app/review",      label: "Ôn tập SRS" },
  { href: "/app/reading",     label: "Đọc hiểu" },
  { href: "/app/grammar",     label: "Ngữ pháp" },
  { href: "/app/conversation",label: "Hội thoại" },
  { href: "/app/vocabulary",  label: "Từ điển" },
  { href: "/app/level-test",  label: "Kiểm tra cấp độ" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-zinc-100 overflow-x-auto">
      <div className="mx-auto flex max-w-5xl px-4">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                active
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
