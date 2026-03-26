import { FlashcardApp } from "@/components/flashcard/FlashcardApp";

export const metadata = { title: "Flashcard SRS – AI Learning" };

export default function FlashcardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Ôn tập Flashcard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Luyện tập từ vựng, kanji và ngữ pháp với thuật toán SRS SM-2.
        </p>
      </div>
      <FlashcardApp />
    </div>
  );
}
