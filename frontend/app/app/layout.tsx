import { UserMenu } from "@/components/UserMenu";
import { AppNav } from "@/components/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <a href="/app/dashboard" className="text-base font-bold text-zinc-900">
            AI Learning 🇯🇵
          </a>
          <UserMenu />
        </div>
        <AppNav />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
