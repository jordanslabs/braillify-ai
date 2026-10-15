"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Camera,
  CameraOff,
  Check,
  Clock3,
  Cloud,
  Copy,
  FileDown,
  Hash,
  House,
  Menu,
  Mic,
  MicOff,
  RefreshCw,
  ScanLine,
  Share2,
  Sparkles,
  Type,
  Volume2,
  VolumeX,
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
type CameraStatus = "idle" | "requesting" | "streaming" | "off" | "error" | "unsupported";
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

function Wave({
  fill,
  variant = "generator",
}: {
  fill: string;
  variant?: "scan" | "generator";
}) {
  const isScanWave = variant === "scan";

  return (
    <div className="relative z-10 -mx-5 -mt-4 -mb-px w-[calc(100%+2.5rem)] shrink-0 overflow-hidden leading-none">
      <svg
        aria-hidden="true"
        className="block h-auto w-full drop-shadow-[0_-14px_16px_rgba(0,0,0,0.35)]"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={
            isScanWave
              ? "M0,64 C380,180 820,30 1440,160 L1440,320 L0,320 Z"
              : "M0,160 C620,30 1060,180 1440,64 L1440,320 L0,320 Z"
          }
          fill={fill}
        />
      </svg>
    </div>
  );
}

function LogoBadge() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8EAF5] p-1.5 shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]">
      <Image
        alt="Logo Braillify"
        className="h-full w-full object-contain"
        height={28}
        src="/logo-braillify.png"
        width={28}
      />
    </div>
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
        FULLY OFFLINE · LOCAL ENGINE
      </span>
    </div>
  );
}

function ModeSwitch({
  mode,
  onSelect,
  surface,
}: {
  mode: ScreenMode;
  onSelect: (mode: ScreenMode) => void;
  surface: "dark" | "light";
}) {
  const isLight = surface === "light";

  return (
    <div
      aria-label="Pilih mode Braillify"
      className={`flex shrink-0 items-center gap-0.5 rounded-[13px] border p-1 ${
        isLight
          ? "border-[#7778A0]/10 bg-[#D9DCEC]/45"
          : "border-white/10 bg-black/10"
      }`}
      role="group"
    >
      {(["scan", "generator"] as const).map((item) => (
        <button
          aria-pressed={mode === item}
          className={`rounded-[9px] px-2.5 py-1.5 text-[9px] font-bold transition ${
            mode === item
              ? isLight
                ? "bg-white/90 text-[#3C3D62] shadow-[2px_2px_6px_rgba(166,175,195,.28),-2px_-2px_5px_rgba(255,255,255,.72)]"
                : "bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12)]"
              : isLight
                ? "text-[#8889A4] hover:text-[#4E5078]"
                : "text-white/45 hover:text-white/75"
          }`}
          key={item}
          onClick={() => onSelect(item)}
          type="button"
        >
          {item === "scan" ? "Pindai" : "Generator"}
        </button>
      ))}
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
  mode,
  onSelectMode,
  onToggleMode,
  onSpeak,
  onCopy,
  onExport,
  onShare,
  isSpeaking,
  exportBusy,
}: {
  active: boolean;
  mode: ScreenMode;
  onSelectMode: (mode: ScreenMode) => void;
  onToggleMode: () => void;
  onSpeak: () => void;
  onCopy: () => void;
  onExport: () => void;
  onShare: () => void;
  isSpeaking: boolean;
  exportBusy: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraRetry, setCameraRetry] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [cameraError, setCameraError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active || !cameraEnabled) {
      stopCamera();
      return;
    }

    let cancelled = false;
    let pendingStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError("");
      setCameraStatus("requesting");
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("unsupported");
        setCameraError("Kamera tidak tersedia. Gunakan HTTPS atau browser yang mendukung kamera.");
        return;
      }

      try {
        pendingStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          pendingStream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) {
          pendingStream.getTracks().forEach((track) => track.stop());
          setCameraStatus("error");
          setCameraError("Jendela kamera belum siap. Coba aktifkan kamera kembali.");
          return;
        }

        streamRef.current = pendingStream;
        video.srcObject = pendingStream;
        await video.play();

        if (!cancelled) setCameraStatus("streaming");
      } catch (error) {
        pendingStream?.getTracks().forEach((track) => track.stop());
        if (streamRef.current === pendingStream) streamRef.current = null;
        if (cancelled) return;

        const name = error instanceof DOMException ? error.name : "";
        setCameraStatus("error");
        setCameraError(
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Izin kamera ditolak. Aktifkan izin kamera browser untuk melihat pratinjau."
            : name === "NotFoundError" || name === "DevicesNotFoundError"
              ? "Kamera tidak ditemukan pada perangkat ini."
              : error instanceof Error
                ? `Kamera gagal dimulai: ${error.message}`
                : "Kamera gagal dimulai. Periksa izin dan coba kembali."
        );
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, cameraEnabled, cameraRetry, stopCamera]);

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) {
      setCameraEnabled(false);
      setCameraStatus("off");
      setCameraError("");
      return;
    }
    setCameraError("");
    setCameraStatus("requesting");
    setCameraEnabled(true);
    setCameraRetry((attempt) => attempt + 1);
  }, [cameraEnabled]);

  return (
    <div className="relative flex h-auto min-h-dvh flex-col overflow-visible bg-[#F0F2FA] lg:h-full lg:min-h-0 lg:overflow-hidden">
      <section className="surf-dark relative flex flex-none flex-col px-5 pb-0 pt-3 text-white lg:min-h-0 lg:flex-[1.52]">
        <div className="relative z-10 grid h-9 grid-cols-3 items-center">
          <Menu aria-hidden="true" className="text-white/65" size={18} />
          <div className="mx-auto">
            <LogoBadge />
          </div>
          <div className="flex justify-end">
            <Cloud aria-label="Pemrosesan lokal" className="text-white/65" size={16} strokeWidth={1.8} />
          </div>
        </div>

        <div className="relative z-10 mt-2 text-center">
          <p className="text-[22px] font-bold leading-tight tracking-[-0.045em] text-[#F0EFFF]">
            BRAILLIFY-AI
          </p>
          <h1 className="mt-0.5 text-[13px] font-medium tracking-[0.02em] text-white/65">
            Pindai Huruf Braille
          </h1>
          <div className="mt-2 flex justify-center">
            <ModeSwitch mode={mode} onSelect={onSelectMode} surface="dark" />
          </div>
        </div>

        <div className="relative z-10 mt-3 flex justify-center">
          <OfflineBadge />
        </div>

        <div className="viewfinder relative mt-3 h-[250px] min-h-[240px] shrink-0 overflow-hidden rounded-[24px] border border-[#67E6DE]/25 lg:h-[250px] lg:min-h-[250px] lg:flex-none">
          <video
            ref={videoRef}
            aria-label="Pratinjau kamera belakang untuk memindai Braille"
            autoPlay
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
              cameraStatus === "streaming" ? "opacity-100" : "opacity-0"
            }`}
            muted
            playsInline
          />
          {cameraStatus !== "streaming" && (
            <div className="absolute inset-0 bg-[#080D18]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_46%,rgba(62,207,207,.15),transparent_58%)]" />
              <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(62,207,207,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(62,207,207,.1)_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center">
                <div aria-hidden="true" className="mb-3 flex justify-center gap-4 opacity-80">
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
                <p className="text-[9px] font-medium leading-relaxed text-white/55">
                  {cameraStatus === "requesting"
                    ? "Meminta izin kamera…"
                    : cameraError || "Aktifkan kamera untuk pratinjau langsung"}
                </p>
              </div>
            </div>
          )}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[8px] font-semibold tracking-wide text-white/55">
            <ScanLine size={11} className="text-[#65DFCE]" />
            {cameraStatus === "streaming" ? "LIVE VIEWFINDER" : "CAMERA VIEWFINDER"}
          </div>

          <div className="pointer-events-none absolute inset-0">
            <div className="neon-bbox absolute inset-x-[13%] top-[24%] flex h-[53%] flex-col items-center justify-center rounded-xl border border-[#5DE5DE]/80 bg-[#1B1B36]/[0.12] shadow-[0_0_22px_rgba(62,207,207,.12),inset_0_0_15px_rgba(62,207,207,.08)]">
              <div className="absolute -top-3 left-2 flex items-center gap-1.5 rounded-md border border-[#3ECFCF]/25 bg-[#1B1B36]/90 px-2 py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ECFCF]" />
                <span className="text-[8px] font-semibold text-[#71E5DE]">
                  Karakter Braille · Conf 98.6%
                </span>
              </div>
              <span className="absolute inset-0 animate-pulse rounded-xl border border-[#5DE5DE]/20" />
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
            {cameraStatus === "streaming" && (
              <span className="scan-line absolute left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#65DFCE] to-transparent shadow-[0_0_8px_#65DFCE]" />
            )}
          </div>

          <button
            aria-label={
              cameraEnabled && cameraStatus !== "off"
                ? "Matikan kamera"
                : "Aktifkan kamera"
            }
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-[#101528]/70 text-[#83E7E0] shadow-[0_4px_14px_rgba(0,0,0,.25)] backdrop-blur-md transition hover:bg-[#101528]/90"
            onClick={toggleCamera}
            title={cameraEnabled ? "Matikan kamera" : "Aktifkan kamera"}
            type="button"
          >
            {cameraEnabled && cameraStatus !== "off" ? (
              <Camera size={16} />
            ) : (
              <CameraOff size={16} />
            )}
          </button>
        </div>

        <Wave fill="#F0F2FA" variant="scan" />
      </section>

      <section
        className="surf-light relative z-10 flex flex-none flex-col px-5 pb-3 pt-4 lg:min-h-0 lg:flex-[0.88]"
        style={{ background: "linear-gradient(150deg, #F0F2FA 0%, #FFFFFF 100%)" }}
      >
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

        <div className="mb-2 mt-2 grid grid-cols-2 gap-2">
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
          className="bottom-nav mt-auto flex min-h-[52px] items-center justify-around rounded-[22px] px-4 py-1.5"
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
            className="btn-circle-glow -mt-5 flex h-[48px] w-[48px] items-center justify-center rounded-full border border-[#A89BFF]/25 text-white shadow-[0_0_24px_rgba(108,99,255,.3)]"
            onClick={onToggleMode}
            type="button"
          >
            <RefreshCw size={19} />
          </button>
          <span className="flex flex-col items-center gap-0.5 text-[#9A9BB4]">
            <Clock3 size={17} />
            <span className="text-[8px] font-semibold">Riwayat</span>
          </span>
        </nav>
      </section>

      <span
        className={`pointer-events-none absolute inset-0 transition lg:rounded-[34px] lg:ring-1 lg:ring-inset ${
          active ? "lg:ring-white/35" : "lg:ring-white/15"
        }`}
      />
    </div>
  );
}

function GeneratorScreen({
  active,
  mode,
  onSelectMode,
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
  mode: ScreenMode;
  onSelectMode: (mode: ScreenMode) => void;
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
    <div className="relative flex h-auto min-h-dvh flex-col overflow-visible bg-[#F0F2FA] lg:h-full lg:min-h-0 lg:overflow-hidden">
      <section
        className="surf-light relative z-0 flex flex-none flex-col px-5 pb-0 pt-3 lg:min-h-0 lg:flex-[1.16]"
        style={{ background: "linear-gradient(150deg, #F0F2FA 0%, #FFFFFF 100%)" }}
      >
        <div className="relative z-10 grid h-9 grid-cols-3 items-center">
          <Menu aria-hidden="true" className="text-[#696A8E]" size={18} />
          <div className="mx-auto">
            <LogoBadge />
          </div>
          <div className="flex justify-end">
            <Cloud aria-label="Mode lokal" className="text-[#77789A]" size={16} strokeWidth={1.8} />
          </div>
        </div>

        <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#8178E8]">
              BRAILLIFY-AI · INPUT
            </p>
            <h2 className="mt-0.5 text-[17px] font-semibold leading-tight tracking-[-0.04em] text-[#1B1B36]">
              Input Teks Latin
            </h2>
          </div>
          <ModeSwitch mode={mode} onSelect={onSelectMode} surface="light" />
        </div>

        <div className="relative z-10 mt-3">
          <div className="mb-2 flex items-center justify-between">
            <label
              className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8888AA]"
              htmlFor="braille-text"
            >
              07 · Input teks
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
              <p className="text-[9px] font-bold uppercase leading-snug tracking-[0.12em] text-[#555675]">
                Representasi Braille digital (preview)
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

      <section className="surf-dark relative z-10 flex flex-none flex-col overflow-hidden px-5 pb-2 pt-[36px] text-white lg:min-h-0 lg:flex-[0.9]">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 w-full opacity-40"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 390 128"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Array.from({ length: 8 }, (_, index) => {
            const offset = index * 9;
            return (
              <path
                d={`M-12 ${14 + offset} C56 ${-8 + offset} 104 ${36 + offset} 174 ${22 + offset} S300 ${8 + offset} 402 ${48 + offset}`}
                key={index}
                stroke="#8294FF"
                strokeOpacity="0.38"
                strokeWidth="0.8"
              />
            );
          })}
        </svg>

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

        <div className="relative z-10 flex gap-2">
          {GRADES.map((preset, index) => (
            <button
              aria-pressed={grade === preset}
              className={`flex min-h-[62px] min-w-0 flex-1 flex-col items-start justify-center gap-1 rounded-[15px] border px-2.5 text-left transition ${
                grade === preset
                  ? "border-[#9B89FF]/50 bg-gradient-to-b from-[#8B7FFF]/[0.2] to-[#8B7FFF]/[0.08] text-[#CEC8FF] shadow-[0_0_15px_rgba(108,99,255,.14)]"
                  : "border-white/[0.08] bg-white/[0.035] text-white/55 hover:bg-white/[0.07]"
              }`}
              key={preset}
              onClick={() => onGrade(preset)}
              type="button"
            >
              <span className="text-[8px] font-bold tracking-[0.16em] text-white/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-semibold leading-tight">{preset}</span>
              {grade === preset && (
                <span className="h-1 w-5 rounded-full bg-[#9B89FF] shadow-[0_0_9px_rgba(155,137,255,.8)]" />
              )}
            </button>
          ))}
        </div>

        <p className="relative z-10 mt-2 text-[8px] leading-relaxed text-white/35">
          Grade 2: kontraksi belum tersedia. Angka &amp; tanda baca otomatis.
        </p>

        <nav
          aria-label="Navigasi generator"
          className="relative z-10 mt-auto flex min-h-[60px] items-center justify-around border-t border-white/[0.08] pt-2"
        >
          <span className="flex flex-col items-center gap-1 text-white/45">
            <House size={17} />
            <span className="text-[8px] font-semibold">Beranda</span>
          </span>
          <button
            aria-label="Beralih ke mode Pindai Braille"
            className="btn-circle-glow -mt-7 flex h-[50px] w-[50px] items-center justify-center rounded-full border border-[#A89BFF]/25 text-white shadow-[0_0_24px_rgba(108,99,255,.3)]"
            onClick={onToggleMode}
            type="button"
          >
            <RefreshCw size={19} />
          </button>
          <span className="flex flex-col items-center gap-1 text-white/45">
            <Clock3 size={17} />
            <span className="text-[8px] font-semibold">Riwayat</span>
          </span>
        </nav>
      </section>

      <span
        className={`pointer-events-none absolute inset-0 transition lg:rounded-[34px] lg:ring-1 lg:ring-inset ${
          active ? "lg:ring-white/35" : "lg:ring-white/15"
        }`}
      />
    </div>
  );
}

function ScreenPanel({
  children,
  active,
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  className?: string;
}) {
  return (
    <article
      className={`flex h-auto min-h-dvh w-full flex-col items-stretch transition-opacity duration-300 lg:h-[min(820px,calc(100svh-40px))] lg:min-h-[700px] lg:w-[390px] lg:max-w-none ${
        active ? "opacity-100" : "opacity-90"
      } ${className}`}
    >
      {children}
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

  const selectMode = useCallback((mode: ScreenMode) => {
    setActiveScreen(mode);
    Speech.stop();
    setIsSpeaking(false);
    Voice.stopListening();
    setIsListening(false);
    voiceInterimRef.current = "";
    setVoiceInterim("");
  }, []);
  const toggleMode = useCallback(() => {
    selectMode(activeScreen === "scan" ? "generator" : "scan");
  }, [activeScreen, selectMode]);

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
      mode={activeScreen}
      onCopy={handleCopy}
      onExport={handleExport}
      onSelectMode={selectMode}
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
      mode={activeScreen}
      onChangeText={setInputText}
      onClear={clearInput}
      onGrade={setGrade}
      onMic={handleMic}
      onSelectMode={selectMode}
      onToggleMode={toggleMode}
      outputText={outputText}
      unsupported={unsupported}
      voiceInterim={voiceInterim}
    />
  );

  return (
    <main className="relative mx-auto flex h-dvh min-h-dvh w-full max-w-md flex-col items-stretch overflow-x-hidden overflow-y-auto bg-[#F0F2FA] p-0 lg:h-auto lg:min-h-screen lg:max-w-none lg:items-center lg:bg-transparent lg:px-4 lg:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(140deg, #D8D9EC 0%, #D0D1E8 47%, #C8C9E2 100%)",
        }}
      >
        <span className="absolute -left-24 top-[12%] h-[370px] w-[370px] rounded-full bg-[#8D86E8]/[0.1] blur-[100px]" />
        <span className="absolute -right-24 bottom-[5%] h-[390px] w-[390px] rounded-full bg-[#6BD9D0]/[0.09] blur-[110px]" />
      </div>

      <section
        aria-label="Braillify-AI, mode pindai dan generator Braille"
        className="relative z-10 flex h-auto min-h-dvh w-full flex-none items-stretch justify-center gap-8 lg:min-h-0 lg:max-w-[1120px] lg:flex-1 lg:gap-8"
      >
        <ScreenPanel
          active={activeScreen === "scan"}
          className={activeScreen === "scan" ? "flex" : "hidden lg:flex"}
        >
          {scanScreen(activeScreen === "scan")}
        </ScreenPanel>

        <ScreenPanel
          active={activeScreen === "generator"}
          className={activeScreen === "generator" ? "flex" : "hidden lg:flex"}
        >
          {generatorScreen(activeScreen === "generator")}
        </ScreenPanel>
      </section>

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
