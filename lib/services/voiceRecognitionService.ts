/* ═══════════════════════════════════════════════════════════════
   Braillify-AI — Voice Recognition Service (STT)

   Uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
   Targets Indonesian (id-ID) recognition.

   IMPORTANT LIMITATIONS:
   - Web Speech API on most Android browsers requires network
     connectivity for recognition processing (audio is sent to
     Google servers)
   - True offline speech recognition is NOT available via this API
   - This feature is marked as "requires network" in the UI
   - For true offline STT, a native Android app with Vosk or
     on-device ML Kit would be required
   ═══════════════════════════════════════════════════════════════ */

import type { VoiceInputState } from "@/lib/types";

/* ── Web Speech API type declarations (not in every TS lib) ── */
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

type VoiceCallback = (state: VoiceInputState, transcript?: string) => void;

let recognition: SpeechRecognitionInstance | null = null;
let stateCallback: VoiceCallback | null = null;

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithSpeech;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSupported(): boolean {
  return getSpeechRecognitionAPI() !== null;
}

/** Note: Web Speech API STT typically requires network */
export function isOfflineCapable(): boolean {
  return false;
}

export function startListening(onUpdate: VoiceCallback): void {
  const API = getSpeechRecognitionAPI();
  if (!API) {
    onUpdate("unavailable");
    return;
  }

  stopListening();

  stateCallback = onUpdate;

  const rec = new API();
  rec.lang = "id-ID";
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onstart = () => stateCallback?.("listening");

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    if (transcript) {
      stateCallback?.("listening", transcript);
    }
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === "not-allowed") {
      stateCallback?.("error", "Izin mikrofon ditolak");
    } else if (event.error === "network") {
      stateCallback?.("error", "Koneksi jaringan diperlukan untuk pengenalan suara");
    } else {
      stateCallback?.("error", `Error: ${event.error}`);
    }
  };

  rec.onend = () => {
    recognition = null;
    stateCallback?.("idle");
  };

  recognition = rec;
  stateCallback?.("listening");

  try {
    rec.start();
  } catch (err) {
    console.warn("Failed to start recognition:", err);
    stateCallback?.("error", "Gagal memulai pengenalan suara");
  }
}

export function stopListening(): void {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      /* already stopped */
    }
    recognition = null;
  }
  stateCallback?.("idle");
}

export function isListening(): boolean {
  return recognition !== null;
}
