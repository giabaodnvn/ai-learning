import KanjiGrid from "@/components/kanji/KanjiGrid";

export default function KanjiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Chữ Hán (Kanji)</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Danh sách chữ kanji theo cấp độ JLPT. Chọn một chữ để xem chi tiết và các từ vựng liên quan.
        </p>
      </div>
      <KanjiGrid />
    </div>
  );
}
