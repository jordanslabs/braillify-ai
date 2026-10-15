/* ═══════════════════════════════════════════════════════════════
   Braillify-AI — Braille Translation Service
   
   Indonesian Braille (Grade 1) mapping based on the standard
   6-dot Braille system. Indonesian Braille follows the same
   base letter assignments as International/English Braille
   (Louis Braille's original French system), since Indonesian
   uses the Latin alphabet without diacritics.
   
   Dot positions:
     ┌───────┐
     │ 1 ● 4 │
     │ 2 ● 5 │
     │ 3 ● 6 │
     └───────┘
   
   Convention notes:
   - Capital indicator: ⠠ (dot 6) placed before the letter
   - Number indicator: ⠼ (dots 3-4-5-6) placed before digits
   - Numbers 1-9,0 use the same cells as letters a-j
   - Punctuation follows international Braille conventions
   - Indonesian-specific: no special contractions in Grade 1
   
   LIMITATIONS (documented):
   - This implements Grade 1 (uncontracted) Braille only
   - Grade 2 (contracted) Indonesian Braille is NOT supported
   - Some rare punctuation may not be mapped
   ═══════════════════════════════════════════════════════════════ */

import type { BrailleCell, TranslationResult } from "@/lib/types";

type DotPattern = [number, number, number, number, number, number];

/* ── Base letter mappings (a-z) ── */
const LETTER_MAP: Record<string, DotPattern> = {
  a: [1, 0, 0, 0, 0, 0],
  b: [1, 1, 0, 0, 0, 0],
  c: [1, 0, 0, 1, 0, 0],
  d: [1, 0, 0, 1, 1, 0],
  e: [1, 0, 0, 0, 1, 0],
  f: [1, 1, 0, 1, 0, 0],
  g: [1, 1, 0, 1, 1, 0],
  h: [1, 1, 0, 0, 1, 0],
  i: [0, 1, 0, 1, 0, 0],
  j: [0, 1, 0, 1, 1, 0],
  k: [1, 0, 1, 0, 0, 0],
  l: [1, 1, 1, 0, 0, 0],
  m: [1, 0, 1, 1, 0, 0],
  n: [1, 0, 1, 1, 1, 0],
  o: [1, 0, 1, 0, 1, 0],
  p: [1, 1, 1, 1, 0, 0],
  q: [1, 1, 1, 1, 1, 0],
  r: [1, 1, 1, 0, 1, 0],
  s: [0, 1, 1, 1, 0, 0],
  t: [0, 1, 1, 1, 1, 0],
  u: [1, 0, 1, 0, 0, 1],
  v: [1, 1, 1, 0, 0, 1],
  w: [0, 1, 0, 1, 1, 1],
  x: [1, 0, 1, 1, 0, 1],
  y: [1, 0, 1, 1, 1, 1],
  z: [1, 0, 1, 0, 1, 1],
};

/* ── Punctuation mappings ── */
const PUNCTUATION_MAP: Record<string, DotPattern> = {
  ".": [0, 1, 0, 0, 1, 1], // dots 2-5-6
  ",": [0, 1, 0, 0, 0, 0], // dot 2
  ";": [0, 1, 1, 0, 0, 0], // dots 2-3
  ":": [0, 1, 0, 0, 1, 0], // dots 2-5
  "!": [0, 1, 1, 0, 1, 0], // dots 2-3-5
  "?": [0, 1, 1, 0, 0, 1], // dots 2-3-6
  "'": [0, 0, 0, 0, 0, 1], // dot 6 (apostrophe)
  "-": [0, 0, 1, 0, 0, 1], // dots 3-6
  '"': [0, 1, 1, 0, 1, 1], // dots 2-3-5-6 (opening/closing quote)
  "(": [0, 1, 1, 0, 0, 1], // dots 2-3-6
  ")": [0, 0, 1, 0, 1, 1], // dots 3-5-6
};

/* ── Special indicators ── */
const CAPITAL_INDICATOR: DotPattern = [0, 0, 0, 0, 0, 1]; // dot 6
const NUMBER_INDICATOR: DotPattern = [0, 0, 1, 1, 1, 1]; // dots 3-4-5-6
const SPACE: DotPattern = [0, 0, 0, 0, 0, 0];

/* ── Number mappings (same cells as a-j) ── */
const NUMBER_MAP: Record<string, DotPattern> = {
  "1": LETTER_MAP.a,
  "2": LETTER_MAP.b,
  "3": LETTER_MAP.c,
  "4": LETTER_MAP.d,
  "5": LETTER_MAP.e,
  "6": LETTER_MAP.f,
  "7": LETTER_MAP.g,
  "8": LETTER_MAP.h,
  "9": LETTER_MAP.i,
  "0": LETTER_MAP.j,
};

/* ── Dot pattern to Unicode Braille (U+2800 block) ── */
function dotsToUnicode(dots: DotPattern): string {
  // Braille Unicode: U+2800 + sum of dot weights
  // dot1=0x01, dot2=0x02, dot3=0x04, dot4=0x08, dot5=0x10, dot6=0x20
  const weights = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20];
  let code = 0x2800;
  for (let i = 0; i < 6; i++) {
    if (dots[i]) code += weights[i];
  }
  return String.fromCharCode(code);
}

/* ── Unicode Braille to dot pattern ── */
function unicodeToDots(ch: string): DotPattern {
  const code = ch.charCodeAt(0) - 0x2800;
  if (code < 0 || code > 0x3f) return [0, 0, 0, 0, 0, 0];
  const weights = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20];
  return weights.map((w) => (code & w ? 1 : 0)) as DotPattern;
}

/* ── Build reverse lookup tables ── */
function buildReverseLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [letter, dots] of Object.entries(LETTER_MAP)) {
    map.set(dotsToUnicode(dots), letter);
  }
  for (const [punct, dots] of Object.entries(PUNCTUATION_MAP)) {
    map.set(dotsToUnicode(dots), punct);
  }
  return map;
}

const REVERSE_MAP = buildReverseLookup();

function buildReverseNumberLookup(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [num, dots] of Object.entries(NUMBER_MAP)) {
    map.set(dotsToUnicode(dots), num);
  }
  return map;
}

const REVERSE_NUMBER_MAP = buildReverseNumberLookup();

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */

/**
 * Convert Latin text to Braille cells with proper indicators.
 */
export function latinToBraille(text: string): TranslationResult {
  const cells: BrailleCell[] = [];
  const unsupported: string[] = [];
  let inNumberMode = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Space
    if (ch === " ") {
      cells.push({
        char: " ",
        dots: SPACE,
        unicode: dotsToUnicode(SPACE),
      });
      inNumberMode = false;
      continue;
    }

    // Newline — treat as space
    if (ch === "\n" || ch === "\r") {
      cells.push({
        char: " ",
        dots: SPACE,
        unicode: dotsToUnicode(SPACE),
      });
      inNumberMode = false;
      continue;
    }

    // Digit
    if (/[0-9]/.test(ch)) {
      if (!inNumberMode) {
        // Insert number indicator
        cells.push({
          char: "#",
          dots: NUMBER_INDICATOR,
          unicode: dotsToUnicode(NUMBER_INDICATOR),
        });
        inNumberMode = true;
      }
      const dots = NUMBER_MAP[ch];
      cells.push({
        char: ch,
        dots: [...dots] as DotPattern,
        unicode: dotsToUnicode(dots),
      });
      continue;
    }

    // Letter
    const lower = ch.toLowerCase();
    if (LETTER_MAP[lower]) {
      inNumberMode = false;

      // Capital indicator
      if (ch !== lower && ch === ch.toUpperCase()) {
        cells.push({
          char: "⠠",
          dots: CAPITAL_INDICATOR,
          unicode: dotsToUnicode(CAPITAL_INDICATOR),
        });
      }

      const dots = LETTER_MAP[lower];
      cells.push({
        char: ch,
        dots: [...dots] as DotPattern,
        unicode: dotsToUnicode(dots),
      });
      continue;
    }

    // Punctuation
    if (PUNCTUATION_MAP[ch]) {
      inNumberMode = false;
      const dots = PUNCTUATION_MAP[ch];
      cells.push({
        char: ch,
        dots: [...dots] as DotPattern,
        unicode: dotsToUnicode(dots),
      });
      continue;
    }

    // Unsupported character
    unsupported.push(ch);
  }

  const unicodeText = cells.map((c) => c.unicode).join("");

  return {
    text: unicodeText,
    cells,
    isComplete: unsupported.length === 0,
    unsupported: [...new Set(unsupported)],
  };
}

/**
 * Convert Braille Unicode text back to Latin text.
 */
export function brailleToLatin(brailleText: string): TranslationResult {
  const cells: BrailleCell[] = [];
  const unsupported: string[] = [];
  let result = "";
  let nextIsCapital = false;
  let inNumberMode = false;

  const capitalUnicode = dotsToUnicode(CAPITAL_INDICATOR);
  const numberUnicode = dotsToUnicode(NUMBER_INDICATOR);
  const spaceUnicode = dotsToUnicode(SPACE);

  for (const ch of brailleText) {
    // Skip non-Braille characters
    const code = ch.charCodeAt(0);
    if (code < 0x2800 || code > 0x283f) {
      if (ch === " " || ch === "\n") {
        result += " ";
        inNumberMode = false;
        nextIsCapital = false;
      }
      continue;
    }

    const dots = unicodeToDots(ch);

    // Space cell
    if (ch === spaceUnicode) {
      result += " ";
      cells.push({ char: " ", dots, unicode: ch });
      inNumberMode = false;
      nextIsCapital = false;
      continue;
    }

    // Capital indicator
    if (ch === capitalUnicode) {
      nextIsCapital = true;
      cells.push({ char: "⠠", dots, unicode: ch });
      continue;
    }

    // Number indicator
    if (ch === numberUnicode) {
      inNumberMode = true;
      cells.push({ char: "#", dots, unicode: ch });
      continue;
    }

    // Number mode
    if (inNumberMode) {
      const num = REVERSE_NUMBER_MAP.get(ch);
      if (num) {
        result += num;
        cells.push({ char: num, dots, unicode: ch });
        continue;
      }
    }

    // Letter/punctuation lookup
    const mapped = REVERSE_MAP.get(ch);
    if (mapped) {
      inNumberMode = false;
      let output = mapped;
      if (nextIsCapital && mapped.length === 1) {
        output = mapped.toUpperCase();
        nextIsCapital = false;
      }
      result += output;
      cells.push({ char: output, dots, unicode: ch });
    } else {
      unsupported.push(ch);
      cells.push({ char: "?", dots, unicode: ch });
    }
  }

  return {
    text: result,
    cells,
    isComplete: unsupported.length === 0,
    unsupported: [...new Set(unsupported)],
  };
}

/**
 * Get display-friendly Braille cells for a Latin string
 * (without indicators, for visual rendering only).
 */
export function getDisplayCells(
  text: string
): { char: string; dots: DotPattern }[] {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => ({
      char: ch,
      dots: LETTER_MAP[ch] ?? PUNCTUATION_MAP[ch] ?? SPACE,
    }));
}
