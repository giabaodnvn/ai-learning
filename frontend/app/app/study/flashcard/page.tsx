import { FlashcardDeck } from "@/components/flashcard/FlashcardDeck";

export const metadata = { title: "Flashcard SRS – AI Learning" };

export default function FlashcardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Ôn tập Flashcard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện tập từ vựng với thuật toán SRS SM-2. Đánh giá mức độ nhớ để
          lên lịch ôn tập tối ưu.
        </p>
      </div>
      <FlashcardDeck />
    </div>
  );
}
