import { FlashcardApp } from "@/components/flashcard/FlashcardApp";

export const metadata = { title: "Flashcard SRS – AI Learning" };

export default function FlashcardPage() {
  return (
    <div className="space-y-6">
      {/* Decorative banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 p-7 text-white shadow-md">
        <div className="pointer-events-none select-none absolute -right-2 top-1/2 -translate-y-1/2 flex gap-3 text-[100px] font-black leading-none text-white/[0.06]">
          <span>復</span><span>習</span><span>札</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/60 to-transparent" />
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo-400 mb-2 uppercase">Luyện tập · SRS</p>
          <h1 className="text-2xl font-bold">Flashcard</h1>
          <p className="mt-1.5 text-sm text-indigo-300">
            Ôn tập từ vựng, kanji và ngữ pháp với thuật toán SRS SM-2 thông minh.
          </p>
        </div>
      </div>

      <FlashcardApp />
    </div>
  );
}
