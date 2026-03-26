import GrammarGrid from "@/components/grammar/GrammarGrid";

export default function GrammarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Ngữ pháp</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Danh sách điểm ngữ pháp theo cấp độ JLPT. Chọn một điểm để xem chi tiết và luyện tập.
        </p>
      </div>
      <GrammarGrid />
    </div>
  );
}
