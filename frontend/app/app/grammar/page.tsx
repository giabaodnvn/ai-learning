import GrammarGrid from "@/components/grammar/GrammarGrid";
import { PageHeader } from "@/components/shared/PageHeader";

export default function GrammarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ngữ pháp"
        description="Danh sách điểm ngữ pháp theo cấp độ JLPT. Chọn một điểm để xem chi tiết và luyện tập."
      />
      <GrammarGrid />
    </div>
  );
}
