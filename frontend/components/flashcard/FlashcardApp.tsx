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

  // SRS mode state
  const [srsConfig, setSrsConfig] = useState<SessionConfig | null>(null);

  // Learn mode state
  const [learnPhase, setLearnPhase] = useState<LearnPhase>({ step: "pick" });

  function handleSrsBack() {
    setSrsConfig(null);
  }

  function handleLearnBack() {
    setLearnPhase({ step: "pick" });
  }

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        <button
          onClick={() => { setTab("learn"); setLearnPhase({ step: "pick" }); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "learn"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Học ngẫu nhiên
        </button>
        <button
          onClick={() => { setTab("srs"); setSrsConfig(null); }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            tab === "srs"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Ôn SRS
        </button>
      </div>

      {/* SRS tab */}
      {tab === "srs" && (
        srsConfig === null ? (
          <SessionSelector onStart={setSrsConfig} />
        ) : (
          <FlashcardDeck config={srsConfig} onBack={handleSrsBack} />
        )
      )}

      {/* Learn tab */}
      {tab === "learn" && (
        <>
          {learnPhase.step === "pick" && (
            <LearnPicker
              onStart={(config) => setLearnPhase({ step: "study", config })}
            />
          )}
          {learnPhase.step === "study" && (
            <LearnDeck
              config={learnPhase.config}
              onFinish={(cards) =>
                setLearnPhase({ step: "quiz", config: learnPhase.config, cards })
              }
              onBack={handleLearnBack}
            />
          )}
          {learnPhase.step === "quiz" && (
            <QuizDeck
              cards={learnPhase.cards}
              onFinish={handleLearnBack}
              onBack={handleLearnBack}
            />
          )}
        </>
      )}
    </div>
  );
}
