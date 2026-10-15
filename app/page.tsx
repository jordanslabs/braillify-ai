"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeftRight,
  AudioLines,
  Check,
  ChevronRight,
  Clock3,
  Cloud,
  Copy,
  FileDown,
  Hash,
  House,
  Menu,
  Mic,
  MicOff,
  ScanLine,
  Share2,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from "lucide-react";

import { latinToBraille } from "@/lib/services/brailleTranslator";
import * as Export from "@/lib/services/exportService";
import * as Speech from "@/lib/services/speechService";
import * as Voice from "@/lib/services/voiceRecognitionService";

const MAX_CHARS = 500;
const SCAN_RESULT = "UNIVERSITAS TEUKU UMAR";
const GRADES = ["Grade 1", "Grade 2", "Angka", "Tanda Baca"] as const;
type Grade = (typeof GRADES)[number];
type ScreenMode = "scan" | "generator";
type ToastKind = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  text: string;
  kind: ToastKind;
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const notify = useCallback((text: string, kind: ToastKind = "success") => {
    const id = ++nextId.current;
    setToasts((current) => [...current, { id, text, kind }]);
    const timer = setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(timer);
    }, 2800);
    timers.current.add(timer);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  return { toasts, notify };
}

function Wave({ fill }: { fill: string }) {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 block h-[58px] w-full"
      preserveAspectRatio="none"
      viewBox="0 0 390 58"
    >
      <path
        d="M0 35C78 8 145 3 214 22c68 19 116 39 176 7v29H0V35Z"
        fill={fill}
      />
    </svg>
  );
}

function OfflineBadge() {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
      style={{
        background: "rgba(61,217,164,0.09)",
        borderColor: "rgba(61,217,164,0.25)",
        boxShadow: "0 0 18px rgba(61,217,164,0.09)",
      }}
      title="Pemrosesan teks Braille berjalan di perangkat"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3DD9A4] opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3DD9A4]" />
      </span>
      <span className="text-[9px] font-bold tracking-[0.12em] text-[#80E7C4]">
        LOCAL ENGINE · OFFLINE READY
      </span>
    </div>
  );
}

function DotCell({
  char,
  dots,
}: {
  char: string;
  dots: number[];
}) {
  return (
    <div
      aria-label={`Braille ${char === " " ? "spasi" : char}`}
      className="flex shrink-0 flex-col items-center gap-1.5"
      role="img"
    >
      <div
        className="flex h-[62px] w-[47px] flex-col items-center justify-center gap-[6px] rounded-[16px] border border-white/50 bg-[#ECEEF8]"
        style={{
          boxShadow:
            "6px 6px 14px rgba(166,175,195,.28), -5px -5px 12px rgba(255,255,255,.82)",
        }}
      >
        {[0, 1, 2].map((row) => (
          <div className="flex gap-[7px]" key={row}>
            {[0, 1].map((col) => {
              const active = dots[row + col * 3] === 1;
              return (
                <span
                  className="h-[9px] w-[9px] rounded-full transition-colors"
                  key={col}
                  style={{
                    background: active
                      ? "linear-gradient(145deg,#FFFFFF,#D7D9EB)"
                      : "#E2E5F1",
                    boxShadow: active
                      ? "2px 2px 5px rgba(156,165,190,.52), -2px -2px 5px rgba(255,255,255,.9)"
                      : "inset 2px 2px 5px rgba(0,0,0,.2), inset -2px -2px 5px rgba(255,255,255,.7)",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <span
        className="max-w-[47px] truncate text-[9px] font-medium text-[#8888AA]"
      >
        {char === " " ? "spasi" : char === "#" ? "angka" : char === "⠠" ? "kapital" : char}
      </span>
    </div>
  );
}

function ScanScreen({
  active,
  onToggleMode,
  onSpeak,
  onCopy,
  onExport,
  onShare,
  isSpeaking,
  exportBusy,
}: {
  active: boolean;
  onToggleMode: () => void;
  onSpeak: () => void;
  onCopy: () => void;
  onExport: () => void;
  onShare: () => void;
  isSpeaking: boolean;
  exportBusy: boolean;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F0F2FA]">
      <section className="surf-dark relative flex min-h-0 flex-[1.12] flex-col px-5 pb-[58px] pt-4 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[9px] font-medium tracking-[0.16em] text-white/40">
            <Cloud size={14} strokeWidth={1.7} />
            <span>BRAILLIFY · 09:41</span>
          </div>
          <div className="absolute left-1/2 top-[-8px] h-[5px] w-12 -translate-x-1/2 rounded-full bg-black/30" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#B8AEFF] to-[#6C63FF] text-[10px] font-bold shadow-[0_4px_10px_rgba(0,0,0,.2)]">
              B
            </div>
            <Menu aria-hidden="true" className="text-white/50" size={18} />
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B89FF]">
              01 / Braille ke Latin
            </p>
            <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.04em] text-white">
              Pindai Braille
            </h1>
          </div>
          <Wifi aria-label="Pemrosesan lokal" className="mb-1 text-[#65DFCE]" size={17} />
        </div>

        <div className="relative z-10 mt-3">
          <OfflineBadge />
        </div>

        <div className="viewfinder relative mt-4 min-h-[150px] flex-1 overflow-hidden rounded-[21px] border border-[#67E6DE]/25">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_46%,rgba(62,207,207,.13),transparent_58%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(62,207,207,.09)_1px,transparent_1px),linear-gradient(90deg,rgba(62,207,207,.09)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-semibold tracking-wide text-white/55">
            <ScanLine size={11} className="text-[#65DFCE]" />
            LIVE VIEWFINDER
          </div>

          <div className="neon-bbox absolute inset-x-[13%] top-[24%] flex h-[53%] flex-col items-center justify-center rounded-xl border border-[#5DE5DE]/80 bg-[#1B1B36]/25 shadow-[0_0_22px_rgba(62,207,207,.12),inset_0_0_15px_rgba(62,207,207,.08)]">
            <div className="absolute -top-3 left-2 flex items-center gap-1.5 rounded-md border border-[#3ECFCF]/25 bg-[#1B1B36]/90 px-2 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ECFCF]" />
              <span className="text-[8px] font-semibold text-[#71E5DE]">
                Karakter Braille · Conf 98.6%
              </span>
            </div>
            <div aria-hidden="true" className="flex items-center gap-4">
              {[
                [1, 0, 1, 0, 0, 1],
                [0, 1, 1, 1, 1, 0],
                [1, 1, 0, 1, 0, 0],
              ].map((dots, cellIndex) => (
                <div className="flex flex-col gap-[5px]" key={cellIndex}>
                  {[0, 1, 2].map((row) => (
                    <div className="flex gap-[5px]" key={row}>
                      {[0, 1].map((col) => (
                        <span
                          className={`h-[7px] w-[7px] rounded-full ${
                            dots[row + col * 3]
                              ? "bg-[#63E5DF] shadow-[0_0_9px_rgba(62,207,207,.72)]"
                              : "bg-white/10"
                          }`}
                          key={col}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {[
            "left-3 top-3 border-l-2 border-t-2",
            "right-3 top-3 border-r-2 border-t-2",
            "bottom-3 left-3 border-b-2 border-l-2",
            "bottom-3 right-3 border-b-2 border-r-2",
          ].map((corner) => (
            <span
              aria-hidden="true"
              className={`absolute h-5 w-5 rounded-[3px] border-[#65DFCE] ${corner}`}
              key={corner}
            />
          ))}
          <span className="scan-line absolute left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#65DFCE] to-transparent shadow-[0_0_8px_#65DFCE]" />
          <span className="absolute bottom-3 left-0 right-0 text-center text-[8px] font-medium text-white/35">
            Pratinjau pemindai · buka kamera untuk menangkap gambar
          </span>
        </div>

        <Link
          className="relative z-10 mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] text-[10px] font-semibold text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition hover:bg-white/[0.12]"
          href="/scanner"
        >
          <ScanLine size={14} className="text-[#72DFD8]" />
          Buka kamera pemindai
          <ChevronRight size={13} className="text-white/35" />
        </Link>

        <Wave fill="#F0F2FA" />
      </section>

      <section className="surf-light relative z-10 flex min-h-0 flex-[0.94] flex-col px-5 pb-3 pt-2">
        <div className="result-card relative rounded-[20px] px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#8888AA]">
              04 · Hasil transkripsi
            </p>
            <span className="flex items-center gap-1 rounded-full bg-[#3DD9A4]/10 px-2 py-1 text-[8px] font-bold text-[#239875]">
              <Check size={10} />
              SELESAI
            </span>
          </div>
          <p className="min-h-[28px] text-[17px] font-extrabold leading-tight tracking-[-0.035em] text-[#1B1B36]">
            {SCAN_RESULT}
          </p>
          <p className="mt-1 text-[9px] font-medium text-[#9A9BB4]">
            Hasil contoh · model pengenal Braille belum tersedia di web
          </p>
        </div>

        <div className="mb-2 mt-3 grid grid-cols-2 gap-2">
          <button
            aria-label={isSpeaking ? "Hentikan pembacaan teks" : "Bacakan teks"}
            className="btn-3d flex h-[54px] items-center gap-2.5 rounded-[16px] px-3 text-left"
            onClick={onSpeak}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C63FF]/10 text-[#6C63FF]">
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#9899B3]">
                05 · Audio
              </span>
              <span className="block text-[11px] font-bold text-[#3C3D62]">
                {isSpeaking ? "Hentikan" : "Dengarkan"}
              </span>
            </span>
          </button>
          <button
            aria-label="Salin teks hasil"
            className="btn-3d flex h-[54px] items-center gap-2.5 rounded-[16px] px-3 text-left"
            onClick={onCopy}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9B89FF]/10 text-[#8474E8]">
              <Copy size={15} />
            </span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#9899B3]">
                09 · Dokumen
              </span>
              <span className="block text-[11px] font-bold text-[#3C3D62]">Salin teks</span>
            </span>
          </button>
          <button
            aria-label="Ekspor hasil sebagai PDF"
            className="btn-3d flex h-[54px] items-center gap-2.5 rounded-[16px] px-3 text-left disabled:cursor-wait disabled:opacity-60"
            disabled={exportBusy}
            onClick={onExport}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3ECFCF]/10 text-[#239DA0]">
              {exportBusy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3ECFCF]/30 border-t-[#239DA0]" />
              ) : (
                <FileDown size={16} />
              )}
            </span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#9899B3]">
                09 · Ekspor
              </span>
              <span className="block text-[11px] font-bold text-[#3C3D62]">Ekspor PDF</span>
            </span>
          </button>
          <button
            aria-label="Bagikan hasil"
            className="btn-3d flex h-[54px] items-center gap-2.5 rounded-[16px] px-3 text-left"
            onClick={onShare}
            type="button"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3DD9A4]/10 text-[#239875]">
              <Share2 size={15} />
            </span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-[#9899B3]">
                09 · Bagikan
              </span>
              <span className="block text-[11px] font-bold text-[#3C3D62]">Share</span>
            </span>
          </button>
        </div>

        <nav
          aria-label="Navigasi pindai"
          className="bottom-nav mt-auto flex min-h-[55px] items-center justify-around rounded-[22px] px-4 py-1.5"
        >
          <button
            aria-current="page"
            className="flex flex-col items-center gap-0.5 text-[#6C63FF]"
            type="button"
          >
            <House size={17} strokeWidth={2.2} />
            <span className="text-[8px] font-bold">Pindai</span>
          </button>
          <button
            aria-label="Beralih ke mode Generator Braille"
            className="btn-circle-neu -mt-5 flex h-[48px] w-[48px] items-center justify-center rounded-full border border-white/70 text-[#6C63FF]"
            onClick={onToggleMode}
            type="button"
          >
            <ArrowLeftRight size={20} />
          </button>
          <span className="flex flex-col items-center gap-0.5 text-[#9A9BB4]">
            <Clock3 size={17} />
            <span className="text-[8px] font-semibold">Riwayat</span>
          </span>
        </nav>
      </section>

      <span
        className={`pointer-events-none absolute inset-0 rounded-[34px] ring-1 ring-inset transition ${
          active ? "ring-white/35" : "ring-white/15"
        }`}
      />
    </div>
  );
}

function GeneratorScreen({
  active,
  inputText,
  onChangeText,
  onClear,
  onMic,
  isListening,
  voiceInterim,
  grade,
  onGrade,
  onToggleMode,
  displayCells,
  outputText,
  unsupported,
}: {
  active: boolean;
  inputText: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  onMic: () => void;
  isListening: boolean;
  voiceInterim: string;
  grade: Grade;
  onGrade: (value: Grade) => void;
  onToggleMode: () => void;
  displayCells: { char: string; dots: number[] }[];
  outputText: string;
  unsupported: string[];
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F0F2FA]">
      <section className="surf-light relative z-0 flex min-h-0 flex-[1.16] flex-col px-5 pb-[58px] pt-4">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8178E8]">
              02 / Latin &amp; suara ke Braille
            </p>
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.04em] text-[#1B1B36]">
              Generator Braille
            </h2>
          </div>
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#ECEEF8] text-[#7168D8] shadow-[4px_4px_9px_rgba(166,175,195,.35),-4px_-4px_9px_rgba(255,255,255,.8)]">
            <Sparkles size={16} />
          </div>
        </div>

        <div className="relative z-10 mt-4">
          <div className="mb-2 flex items-center justify-between">
            <label
              className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8888AA]"
              htmlFor="braille-text"
            >
              07 · Teks Latin
            </label>
            <span
              className={`text-[9px] font-semibold ${
                inputText.length >= MAX_CHARS ? "text-red-500" : "text-[#A6A7BC]"
              }`}
            >
              {inputText.length}/{MAX_CHARS}
            </span>
          </div>
          <div className="relative">
            <textarea
              aria-label="Input teks Latin untuk diterjemahkan ke Braille"
              className="input-neu block min-h-[88px] w-full resize-none rounded-[18px] px-4 py-3 pr-[88px] text-[12px] font-medium leading-relaxed text-[#292A4D] placeholder:text-[#A8A9BD]"
              id="braille-text"
              maxLength={MAX_CHARS}
              onChange={(event) => onChangeText(event.target.value)}
              placeholder="Ketik kata atau kalimat di sini…"
              readOnly={isListening}
              value={
                isListening && voiceInterim
                  ? `${inputText}${inputText ? " " : ""}${voiceInterim}`
                  : inputText
              }
            />
            <div className="absolute right-2.5 top-2.5 flex gap-1.5">
              <button
                aria-label={isListening ? "Hentikan input suara" : "Mulai input suara"}
                className={`neu-card-sm flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isListening
                    ? "mic-pulse text-[#6C63FF]"
                    : "text-[#8586A5] hover:text-[#6C63FF]"
                }`}
                onClick={onMic}
                type="button"
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              {inputText && (
                <button
                  aria-label="Hapus semua teks"
                  className="neu-card-sm flex h-9 w-9 items-center justify-center rounded-xl text-[#A1A2B8] hover:text-red-500"
                  onClick={onClear}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-[#9798AE]">
            <Mic size={11} className="mt-px shrink-0 text-[#8E83E8]" />
            {isListening
              ? "Mendengarkan Bahasa Indonesia…"
              : "06 · Suara id-ID — dukungan offline bergantung browser dan perangkat."}
          </p>
        </div>

        {unsupported.length > 0 && (
          <div className="relative z-10 mt-2 flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-100/40 px-3 py-2 text-[9px] text-amber-800">
            <AlertCircle className="mt-px shrink-0" size={12} />
            <span>Karakter tidak didukung: {unsupported.map((char) => `"${char}"`).join(", ")}</span>
          </div>
        )}

        <div className="relative z-10 mt-4 flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={13} className="text-[#8D84DE]" />
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8888AA]">
                08 · Matriks Braille digital
              </p>
            </div>
            <span className="rounded-full border border-[#6C63FF]/15 bg-[#6C63FF]/[0.07] px-2.5 py-1 text-[8px] font-bold text-[#6C63FF]">
              {grade}
            </span>
          </div>

          <div className="neu-card-inset min-h-[112px] flex-1 overflow-y-auto rounded-[19px] p-3">
            {displayCells.length > 0 ? (
              <div className="flex flex-wrap content-start gap-x-2.5 gap-y-2">
                {displayCells.map((cell, index) => (
                  <DotCell
                    char={cell.char}
                    dots={cell.dots}
                    key={`${index}-${cell.char}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[84px] flex-col items-center justify-center gap-2 text-center">
                <div className="flex gap-1.5 opacity-45" aria-hidden="true">
                  {[0, 1, 2].map((row) => (
                    <span
                      className="h-[7px] w-[7px] rounded-full bg-[#C6C9DD] shadow-[inset_1px_1px_2px_rgba(0,0,0,.15)]"
                      key={row}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-medium text-[#A3A4B9]">
                  Hasil Braille tampil di sini
                </p>
              </div>
            )}
          </div>

          {outputText && (
            <div className="mt-2 flex min-h-8 items-start gap-2 rounded-xl border border-[#6C63FF]/10 bg-[#6C63FF]/[0.045] px-3 py-2">
              <span className="mt-px text-[10px] text-[#8178E8]">⠿</span>
              <p className="break-all font-mono text-[11px] leading-relaxed text-[#55567D]">
                {outputText}
              </p>
            </div>
          )}
        </div>

        <Wave fill="#1B1B36" />
      </section>

      <section className="surf-dark relative z-10 flex min-h-0 flex-[0.9] flex-col px-5 pb-2 pt-[36px] text-white">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
              08 / Konfigurasi
            </p>
            <h3 className="mt-0.5 text-[13px] font-semibold text-white/90">
              Preset &amp; Grade Braille
            </h3>
          </div>
          <Type size={16} className="text-[#9B89FF]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GRADES.map((preset) => (
            <button
              aria-pressed={grade === preset}
              className={`flex min-h-[36px] items-center justify-between rounded-xl border px-3 text-left text-[10px] font-semibold transition ${
                grade === preset
                  ? "border-[#9B89FF]/50 bg-[#8B7FFF]/[0.19] text-[#CEC8FF] shadow-[0_0_15px_rgba(108,99,255,.14)]"
                  : "border-white/[0.08] bg-white/[0.035] text-white/50 hover:bg-white/[0.07]"
              }`}
              key={preset}
              onClick={() => onGrade(preset)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    grade === preset ? "bg-[#9B89FF]" : "bg-white/20"
                  }`}
                />
                {preset}
              </span>
              {grade === preset && <Check size={12} className="text-[#B5ABFF]" />}
            </button>
          ))}
        </div>

        <p className="mt-1 text-[8px] leading-relaxed text-white/30">
          Grade 2: kontraksi belum tersedia. Angka &amp; tanda baca otomatis.
        </p>

        <div className="mt-auto flex justify-center pt-2">
          <button
            aria-label="Beralih ke mode Pindai Braille"
            className="btn-circle-glow flex h-[47px] w-[47px] items-center justify-center rounded-full border border-[#A89BFF]/25 text-white shadow-[0_0_24px_rgba(108,99,255,.3)]"
            onClick={onToggleMode}
            type="button"
          >
            <ArrowLeftRight size={19} />
          </button>
        </div>
      </section>

      <span
        className={`pointer-events-none absolute inset-0 rounded-[34px] ring-1 ring-inset transition ${
          active ? "ring-white/35" : "ring-white/15"
        }`}
      />
    </div>
  );
}

function DeviceFrame({
  children,
  title,
  mode,
  active,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  mode: string;
  active: boolean;
  className?: string;
}) {
  return (
    <article className={`flex flex-col items-center ${className}`}>
      <div className="mb-3 flex w-full items-center justify-between px-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#767796]">
            {mode}
          </p>
          <h2 className="text-[13px] font-bold tracking-[-0.02em] text-[#2A2B50]">
            {title}
          </h2>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[8px] font-bold tracking-[0.12em] ${
            active
              ? "border-[#6C63FF]/20 bg-[#6C63FF]/[0.08] text-[#6C63FF]"
              : "border-white/50 bg-white/25 text-[#9293AB]"
          }`}
        >
          {active ? "ACTIVE" : "READY"}
        </span>
      </div>
      <div
        className={`phone-bezel shrink-0 p-[10px] transition duration-300 ${
          active ? "scale-[1.008]" : "scale-100 opacity-[0.94]"
        }`}
        style={{
          width: "min(346px, calc(100vw - 34px))",
          height: "min(710px, calc(100svh - 220px))",
          minHeight: 590,
        }}
      >
        <div className="screen-inner relative h-full w-full">{children}</div>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenMode>("scan");
  const [inputText, setInputText] = useState("");
  const [grade, setGrade] = useState<Grade>("Grade 1");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const { toasts, notify } = useToast();
  const voiceInterimRef = useRef("");

  const brailleResult = useMemo(
    () => (inputText.trim() ? latinToBraille(inputText) : null),
    [inputText]
  );
  const displayCells = brailleResult?.cells ?? [];
  const outputText = brailleResult?.text ?? "";
  const unsupported = brailleResult?.unsupported ?? [];

  const toggleMode = useCallback(() => {
    setActiveScreen((current) => (current === "scan" ? "generator" : "scan"));
    Speech.stop();
    setIsSpeaking(false);
    Voice.stopListening();
    setIsListening(false);
    voiceInterimRef.current = "";
    setVoiceInterim("");
  }, []);

  const handleSpeak = useCallback(() => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!Speech.isSupported()) {
      notify("Pembaca suara tidak didukung browser ini", "error");
      return;
    }
    Speech.speak(SCAN_RESULT, (state) => setIsSpeaking(state === "speaking"));
  }, [isSpeaking, notify]);

  const handleCopy = useCallback(async () => {
    const result = await Export.copyToClipboard(SCAN_RESULT);
    notify(
      result.success ? "Teks transkripsi berhasil disalin" : result.error ?? "Gagal menyalin teks",
      result.success ? "success" : "error"
    );
  }, [notify]);

  const handleShare = useCallback(async () => {
    const result = await Export.shareContent("Hasil Pindai Braille", SCAN_RESULT);
    if (result.success) {
      notify("Dokumen siap dibagikan", "success");
    } else if (result.error !== "Berbagi dibatalkan") {
      notify(result.error ?? "Gagal membagikan dokumen", "error");
    }
  }, [notify]);

  const handleExport = useCallback(async () => {
    setExportBusy(true);
    try {
      const result = await Export.exportAsPdf(
        SCAN_RESULT,
        "",
        `braillify-${Date.now()}`
      );
      notify(
        result.success
          ? `PDF tersimpan: ${result.filename ?? "braillify.pdf"}`
          : result.error ?? "Gagal mengekspor dokumen",
        result.success ? "success" : "error"
      );
    } finally {
      setExportBusy(false);
    }
  }, [notify]);

  const handleMic = useCallback(() => {
    if (isListening) {
      Voice.stopListening();
      setIsListening(false);
      setVoiceInterim("");
      return;
    }
    if (!Voice.isSupported()) {
      notify("Pengenalan suara tidak didukung browser ini", "error");
      return;
    }

    setVoiceInterim("");
    voiceInterimRef.current = "";
    setIsListening(true);
    Voice.startListening((state, transcript) => {
      if (state === "listening" && transcript) {
        voiceInterimRef.current = transcript;
        setVoiceInterim(transcript);
      } else if (state === "idle") {
        const finalTranscript = voiceInterimRef.current.trim();
        if (finalTranscript) {
          setInputText((text) =>
            `${text}${text ? " " : ""}${finalTranscript}`.slice(0, MAX_CHARS)
          );
        }
        voiceInterimRef.current = "";
        setVoiceInterim("");
        setIsListening(false);
      } else if (state === "error" || state === "unavailable") {
        notify(transcript ?? "Pengenalan suara tidak tersedia", "error");
        voiceInterimRef.current = "";
        setVoiceInterim("");
        setIsListening(false);
      }
    });
  }, [isListening, notify]);

  const clearInput = useCallback(() => {
    setInputText("");
    voiceInterimRef.current = "";
    setVoiceInterim("");
    Voice.stopListening();
    setIsListening(false);
  }, []);

  useEffect(
    () => () => {
      Speech.stop();
      Voice.stopListening();
    },
    []
  );

  const scanScreen = (active: boolean) => (
    <ScanScreen
      active={active}
      exportBusy={exportBusy}
      isSpeaking={isSpeaking}
      onCopy={handleCopy}
      onExport={handleExport}
      onShare={handleShare}
      onSpeak={handleSpeak}
      onToggleMode={toggleMode}
    />
  );

  const generatorScreen = (active: boolean) => (
    <GeneratorScreen
      active={active}
      displayCells={displayCells}
      grade={grade}
      inputText={inputText}
      isListening={isListening}
      onChangeText={setInputText}
      onClear={clearInput}
      onGrade={setGrade}
      onMic={handleMic}
      onToggleMode={toggleMode}
      outputText={outputText}
      unsupported={unsupported}
      voiceInterim={voiceInterim}
    />
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden overflow-y-auto px-4 pb-8 pt-5 sm:px-6 sm:pt-7">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "linear-gradient(140deg, #D8D9EC 0%, #D0D1E8 47%, #C8C9E2 100%)",
        }}
      >
        <span className="absolute -left-24 top-[12%] h-[370px] w-[370px] rounded-full bg-[#8D86E8]/[0.1] blur-[100px]" />
        <span className="absolute -right-24 bottom-[5%] h-[390px] w-[390px] rounded-full bg-[#6BD9D0]/[0.09] blur-[110px]" />
      </div>

      <header className="relative z-10 mb-5 flex w-full max-w-[1120px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-white/70 bg-[#E6E7F2]/85 text-[#6C63FF] shadow-[5px_5px_12px_rgba(140,145,185,.25),-4px_-4px_10px_rgba(255,255,255,.68)]">
            <AudioLines size={19} />
          </div>
          <div>
            <p className="text-[13px] font-extrabold tracking-[-0.04em] text-[#292A4E]">
              Braillify<span className="text-[#7569E8]">-AI</span>
            </p>
            <p className="text-[9px] font-medium tracking-wide text-[#777894]">
              ACCESSIBILITY, REIMAGINED
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/50 bg-white/25 px-3 py-2 text-[9px] font-semibold text-[#666783] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#35B88D] shadow-[0_0_8px_rgba(53,184,141,.6)]" />
          TRANSLASI LOKAL · SIAP OFFLINE
        </div>
      </header>

      <div className="relative z-10 mb-4 flex w-full max-w-[1120px] items-center justify-between gap-3 lg:hidden">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#777894]">
            Pilih mode
          </p>
          <h1 className="text-[15px] font-bold tracking-[-0.03em] text-[#2B2C51]">
            Braille, lebih dekat.
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-white/50 bg-white/30 p-1 shadow-[inset_2px_2px_5px_rgba(120,125,165,.08)]">
          <button
            aria-pressed={activeScreen === "scan"}
            className={`rounded-xl px-3 py-2 text-[10px] font-bold transition ${
              activeScreen === "scan"
                ? "bg-[#E7E8F4] text-[#6359D2] shadow-[3px_3px_8px_rgba(130,135,175,.2),-2px_-2px_6px_rgba(255,255,255,.7)]"
                : "text-[#777894]"
            }`}
            onClick={() => setActiveScreen("scan")}
            type="button"
          >
            Pindai
          </button>
          <button
            aria-pressed={activeScreen === "generator"}
            className={`rounded-xl px-3 py-2 text-[10px] font-bold transition ${
              activeScreen === "generator"
                ? "bg-[#E7E8F4] text-[#6359D2] shadow-[3px_3px_8px_rgba(130,135,175,.2),-2px_-2px_6px_rgba(255,255,255,.7)]"
                : "text-[#777894]"
            }`}
            onClick={() => setActiveScreen("generator")}
            type="button"
          >
            Generator
          </button>
        </div>
      </div>

      <section
        aria-label="Braillify-AI, mode pindai dan generator Braille"
        className="relative z-10 flex w-full max-w-[1120px] flex-1 items-start justify-center gap-8 lg:items-center lg:gap-10"
      >
        <DeviceFrame
          active={activeScreen === "scan"}
          className={activeScreen === "scan" ? "flex" : "hidden lg:flex"}
          mode="SCREEN 01"
          title="Pindai → Latin"
        >
          {scanScreen(activeScreen === "scan")}
        </DeviceFrame>

        <div className="hidden shrink-0 flex-col items-center gap-3 lg:flex">
          <span className="h-20 w-px bg-gradient-to-b from-transparent via-[#8984C8]/40 to-transparent" />
          <button
            aria-label="Beralih mode aktif"
            className="btn-circle-neu flex h-[50px] w-[50px] items-center justify-center rounded-full text-[#6C63FF]"
            onClick={toggleMode}
            type="button"
          >
            <ArrowLeftRight size={20} />
          </button>
          <span className="max-w-[76px] text-center text-[8px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-[#7D7E9D]">
            Ganti mode
          </span>
          <span className="h-20 w-px bg-gradient-to-b from-transparent via-[#8984C8]/40 to-transparent" />
        </div>

        <DeviceFrame
          active={activeScreen === "generator"}
          className={activeScreen === "generator" ? "flex" : "hidden lg:flex"}
          mode="SCREEN 02"
          title="Latin → Braille"
        >
          {generatorScreen(activeScreen === "generator")}
        </DeviceFrame>
      </section>

      <footer className="relative z-10 mt-4 hidden w-full max-w-[1120px] items-center justify-between px-2 text-[9px] font-medium text-[#777894] lg:flex">
        <span>Dirancang untuk komunikasi yang lebih inklusif.</span>
        <span>TEKS &amp; BRAILLE · DI PERANGKAT</span>
      </footer>

      <div
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-5 z-[100] flex w-max max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col gap-2"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            className={`toast-in flex items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-semibold shadow-xl backdrop-blur-xl ${
              toast.kind === "success"
                ? "border-[#3DD9A4]/30 bg-[#1B1B36]/90 text-[#8AEACB]"
                : toast.kind === "error"
                  ? "border-red-300/30 bg-[#1B1B36]/90 text-[#FFB1B1]"
                  : "border-[#A5A8FF]/30 bg-[#1B1B36]/90 text-[#C2BFFF]"
            }`}
            key={toast.id}
          >
            {toast.kind === "success" ? (
              <Check size={14} />
            ) : toast.kind === "error" ? (
              <AlertCircle size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            {toast.text}
          </div>
        ))}
      </div>
    </main>
  );
}
