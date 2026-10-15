/* ═══════════════════════════════════════════════════════════════
   Braillify-AI — Speech Service (TTS)
   
   Uses the Web Speech API (window.speechSynthesis).
   Targets Indonesian (id-ID) voice when available.
   
   LIMITATIONS:
   - Offline availability depends on the device having downloaded
     an Indonesian TTS voice pack
   - On most Android Chrome, Google voices require network for
     first download but work offline after installation
   - If no id-ID voice is found, falls back to default voice
   ═══════════════════════════════════════════════════════════════ */

import type { SpeechState } from "@/lib/types";

type SpeechCallback = (state: SpeechState) => void;

let currentUtterance: SpeechSynthesisUtterance | null = null;
let stateCallback: SpeechCallback | null = null;

function getIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer offline voices first
  const offlineId = voices.find(
    (v) => v.lang.startsWith("id") && v.localService
  );
  if (offlineId) return offlineId;
  // Any Indonesian voice
  const anyId = voices.find((v) => v.lang.startsWith("id"));
  if (anyId) return anyId;
  return null;
}

export function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function hasIndonesianVoice(): boolean {
  return getIndonesianVoice() !== null;
}

export function speak(
  text: string,
  onStateChange?: SpeechCallback
): void {
  if (!isSupported() || !text.trim()) return;

  stop(); // Cancel any active speech

  stateCallback = onStateChange ?? null;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  const voice = getIndonesianVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => stateCallback?.("speaking");
  utterance.onend = () => {
    currentUtterance = null;
    stateCallback?.("idle");
  };
  utterance.onerror = (e) => {
    console.warn("TTS error:", e.error);
    currentUtterance = null;
    stateCallback?.("error");
  };
  utterance.onpause = () => stateCallback?.("paused");
  utterance.onresume = () => stateCallback?.("speaking");

  currentUtterance = utterance;
  stateCallback?.("speaking");
  window.speechSynthesis.speak(utterance);
}

export function stop(): void {
  if (!isSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
  stateCallback?.("idle");
}

export function pause(): void {
  if (!isSupported()) return;
  window.speechSynthesis.pause();
}

export function resume(): void {
  if (!isSupported()) return;
  window.speechSynthesis.resume();
}

export function isSpeaking(): boolean {
  if (!isSupported()) return false;
  return window.speechSynthesis.speaking;
}

/** Preload voices (some browsers load them async) */
export function preloadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (!isSupported()) {
      resolve();
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => resolve();
    // Timeout fallback
    setTimeout(resolve, 2000);
  });
}
