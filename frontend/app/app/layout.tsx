import { UserMenu } from "@/components/UserMenu";
import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 shadow-lg shadow-indigo-950/30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">

          {/* Logo */}
          <a href="/app/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white font-bold text-base ring-1 ring-white/20 group-hover:bg-white/20 transition-all">
              日
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white tracking-wide">AI Learning</p>
              <p className="text-[10px] text-indigo-300 font-medium tracking-widest">日本語学習</p>
            </div>
          </a>

          <UserMenu />
        </div>

        {/* Navigation */}
        <AppNav />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
