import KanjiGrid from "@/components/kanji/KanjiGrid";

export default function KanjiPage() {
  return (
    <div className="space-y-6">
      {/* Decorative banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-stone-800 to-zinc-900 p-7 text-white shadow-md">
        <div className="pointer-events-none select-none absolute -right-2 top-1/2 -translate-y-1/2 flex gap-3 text-[100px] font-black leading-none text-white/[0.06]">
          <span>漢</span><span>字</span><span>学</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-indigo-950/40" />
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 mb-2 uppercase">Chữ Hán · 漢字</p>
          <h1 className="text-2xl font-bold">Kanji theo JLPT</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Học và tra cứu chữ Hán theo từng cấp độ. Chọn một chữ để xem chi tiết và từ vựng liên quan.
          </p>
        </div>
      </div>

      <KanjiGrid />
    </div>
  );
}
