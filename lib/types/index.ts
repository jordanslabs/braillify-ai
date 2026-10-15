/* ═══════════════════════════════════════════════════════════════
   Braillify-AI — TypeScript Type Definitions
   ═══════════════════════════════════════════════════════════════ */

/** Translation direction modes */
export type TranslationMode = "latin-to-braille" | "braille-to-latin";

/** Status of the offline AI model */
export type ModelStatus = "ready" | "unavailable" | "loading" | "error";

/** Status of the offline engine */
export type OfflineStatus = "offline-ready" | "checking" | "online" | "unknown";

/** A single Braille cell with its 6-dot pattern */
export interface BrailleCell {
  /** The original character (Latin or Braille Unicode) */
  char: string;
  /** 6-dot pattern: [d1, d2, d3, d4, d5, d6] — 1 = raised, 0 = flat */
  dots: [number, number, number, number, number, number];
  /** Braille Unicode character (U+2800 block) */
  unicode: string;
}

/** Result of a translation operation */
export interface TranslationResult {
  /** The translated text (Latin or Braille Unicode) */
  text: string;
  /** Individual Braille cells for visual rendering */
  cells: BrailleCell[];
  /** Whether the result is complete or partial */
  isComplete: boolean;
  /** Characters that could not be translated */
  unsupported: string[];
}

/** Camera/scanner state */
export type ScannerState =
  | "idle"
  | "requesting-permission"
  | "permission-denied"
  | "previewing"
  | "capturing"
  | "processing"
  | "result"
  | "error";

/** A detected Braille region from AI recognition */
export interface BrailleDetection {
  /** Bounding box [x, y, width, height] as fractions 0–1 */
  bbox: [number, number, number, number];
  /** Recognized text */
  text: string;
  /** Confidence score 0–1 */
  confidence: number;
}

/** Recognition result from the AI engine */
export interface RecognitionResult {
  detections: BrailleDetection[];
  /** Full transcription of all detected regions */
  fullText: string;
  /** Processing time in ms */
  processingTimeMs: number;
  /** Whether this is a real AI result or simulated */
  isModelResult: boolean;
}

/** Speech playback state */
export type SpeechState = "idle" | "speaking" | "paused" | "error";

/** Voice input state */
export type VoiceInputState =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unavailable";

/** Export format options */
export type ExportFormat = "text" | "image" | "pdf";

/** Export result */
export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename?: string;
  error?: string;
}
