/**
 * Fire-and-forget Japanese text-to-speech: say this once, no controls.
 *
 * The flashcard's speaker button and the chat bubble's each had their own copy
 * of the same four lines (guard, cancel, set ja-JP, speak) — and only one of
 * them set a rate.
 *
 * Playback the user can pause, resume, or follow along with belongs to
 * `useTextToSpeech`, which owns an utterance and its event handlers; this is
 * for the cases that need neither.
 */
export function speakJapanese(text: string, rate = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = rate;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
