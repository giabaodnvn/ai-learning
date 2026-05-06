"use client";

import { useState } from "react";
import { SessionSelector } from "./SessionSelector";
import { FlashcardDeck } from "./FlashcardDeck";
import { LearnPicker } from "./LearnPicker";
import { LearnDeck } from "./LearnDeck";
import { QuizDeck } from "./QuizDeck";
import type { SessionConfig } from "@/lib/stores/flashcardStore";
import type { LearnConfig, RandomCard } from "@/lib/flashcard-utils";

type Tab = "srs" | "learn";

type LearnPhase =
  | { step: "pick" }
  | { step: "study"; config: LearnConfig }
  | { step: "quiz";  config: LearnConfig; cards: RandomCard[] };

export function FlashcardApp() {
  const [tab, setTab] = useState<Tab>("learn");
  const [srsConfig, setSrsConfig] = useState<SessionConfig | null>(null);
  const [learnPhase, setLearnPhase] = useState<LearnPhase>({ step: "pick" });

  function handleSrsBack() { setSrsConfig(null); }
  function handleLearnBack() { setLearnPhase({ step: "pick" }); }

  return (
    <div className="space-y-5">

      {/* Tab bar */}
      <div className="flex gap-1.5 rounded-2xl bg-stone-100 p-1.5">
        <button
          onClick={() => { setTab("learn"); setLearnPhase({ step: "pick" }); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === "learn"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <span className="text-base leading-none">🎲</span>
          Học ngẫu nhiên
        </button>
        <button
          onClick={() => { setTab("srs"); setSrsConfig(null); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
            tab === "srs"
              ? "bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <span className="text-base leading-none">🔁</span>
          Ôn SRS
        </button>
      </div>

      {/* SRS tab */}
      {tab === "srs" && (
        srsConfig === null
          ? <SessionSelector onStart={setSrsConfig} />
          : <FlashcardDeck config={srsConfig} onBack={handleSrsBack} />
      )}

      {/* Learn tab */}
      {tab === "learn" && (
        <>
          {learnPhase.step === "pick" && (
            <LearnPicker onStart={(config) => setLearnPhase({ step: "study", config })} />
          )}
          {learnPhase.step === "study" && (
            <LearnDeck
              config={learnPhase.config}
              onFinish={(cards) => setLearnPhase({ step: "quiz", config: learnPhase.config, cards })}
              onBack={handleLearnBack}
            />
          )}
          {learnPhase.step === "quiz" && (
            <QuizDeck cards={learnPhase.cards} onFinish={handleLearnBack} onBack={handleLearnBack} />
          )}
        </>
      )}
    </div>
  );
}
