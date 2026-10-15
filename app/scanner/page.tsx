"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  ScanLine,
  RefreshCw,
  Copy,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import * as Speech from "@/lib/services/speechService";
import * as Export from "@/lib/services/exportService";
import type { ScannerState } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────
   NOTE: AI Braille recognition engine is NOT available in this
   web build. Camera capture + image display work correctly.
   Recognition requires a native Android build with TFLite/ONNX.
   ───────────────────────────────────────────────────────────── */

export default function ScannerPage() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  const [scanState, setScanState]       = useState<ScannerState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [clock, setClock] = useState("--:--");

  const RECOGNITION_NOTE =
    "Model AI tidak tersedia pada versi web ini. Gunakan kamera untuk memotret dokumen Braille, lalu salin gambar ke aplikasi pengenalan offline.";

  /* ── Start camera ── */
  const startCamera = useCallback(async () => {
    setScanState("requesting-permission");
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState("previewing");
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanState("permission-denied");
        setErrorMessage("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser Anda.");
      } else if (e.name === "NotFoundError" || e.name === "DevicesNotFoundError") {
        setScanState("error");
        setErrorMessage("Tidak ada kamera yang ditemukan pada perangkat ini.");
      } else {
        setScanState("error");
        setErrorMessage(`Gagal mengakses kamera: ${e.message}`);
      }
    }
  }, []);

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /* ── Capture frame ── */
  const captureFrame = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setScanState("capturing");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
    setScanState("processing");
    setTimeout(() => setScanState("result"), 800);
  }, [stopCamera]);

  /* ── Reset ── */
  const reset = useCallback(() => {
    Speech.stop(); setIsSpeaking(false);
    setCapturedImage(null); setScanState("idle"); setErrorMessage("");
  }, []);

  /* ── TTS ── */
  const handleSpeak = useCallback(() => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); return; }
    Speech.speak(RECOGNITION_NOTE, s => setIsSpeaking(s === "speaking"));
  }, [isSpeaking]);

  /* ── Copy ── */
  const handleCopy = useCallback(async () => {
    await Export.copyToClipboard(RECOGNITION_NOTE);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, []);

  /* ── Cleanup ── */
  useEffect(() => () => { stopCamera(); Speech.stop(); }, [stopCamera]);
  useEffect(() => {
    const updateClock = () =>
      setClock(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  /* ══════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen p-4 overflow-hidden"
         style={{ background: "#0F0E28" }}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] rounded-full glow-blob-1 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4  w-[340px] h-[340px] rounded-full glow-blob-2 blur-[90px]" />
      </div>

      {/* Phone frame */}
      <div className="relative w-[390px] h-[844px] rounded-[46px] phone-frame overflow-hidden flex flex-col">

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[108px] h-[28px] bg-black/80 rounded-b-[20px] z-30" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-7 pt-9 pb-1 z-20">
          <span className="text-[11px] font-semibold text-[#B9B9F1]/50">
            {clock}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(252,211,77,0.08)] border border-[rgba(252,211,77,0.20)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D]" />
            <span className="text-[9px] font-bold text-[#FCD34D] tracking-wide">AI UNAVAILABLE</span>
          </div>
        </div>

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 z-20">
          <Link
            href="/"
            onClick={stopCamera}
            className="w-9 h-9 rounded-2xl fab flex items-center justify-center"
            aria-label="Kembali ke halaman utama"
          >
            <ArrowLeft size={17} className="text-[#B9B9F1]" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[15px] font-bold leading-tight" style={{ color: "#F0EFFF" }}>
              Pemindai Braille
            </h1>
            <p className="text-[10px] font-medium" style={{ color: "#8585A8" }}>
              Kamera &amp; Tangkap
            </p>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 pb-5 gap-4">

          {/* ── IDLE ── */}
          {scanState === "idle" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {/* Camera icon in lavender panel */}
              <div className="lavender-panel w-24 h-24 rounded-[32px] flex items-center justify-center">
                <Camera size={38} style={{ color: "#6B7EF7" }} />
              </div>

              <div className="text-center">
                <p className="text-[16px] font-bold mb-1.5" style={{ color: "#F0EFFF" }}>
                  Buka Kamera
                </p>
                <p className="text-[12px] leading-relaxed max-w-[230px] mx-auto" style={{ color: "#8585A8" }}>
                  Arahkan ke dokumen Braille dan tekan tombol tangkap
                </p>
              </div>

              {/* AI caveat */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl max-w-[290px]"
                   style={{ background: "rgba(252,211,77,0.06)", border: "1px solid rgba(252,211,77,0.18)" }}>
                <AlertTriangle size={13} className="text-[#FCD34D] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(252,211,77,0.75)" }}>
                  Pengenalan AI tidak tersedia di versi web. Model deep-learning memerlukan build Android native.
                </p>
              </div>

              {/* Open camera — primary FAB + label */}
              <button
                onClick={startCamera}
                aria-label="Buka kamera untuk memindai Braille"
                className="fab-primary flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[13px] font-bold text-white cursor-pointer transition-all"
              >
                <Camera size={16} />
                Buka Kamera
              </button>
            </div>
          )}

          {/* ── REQUESTING PERMISSION ── */}
          {scanState === "requesting-permission" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-[rgba(130,148,255,0.25)] border-t-[#8294FF] animate-spin" />
              <p className="text-[13px] font-medium" style={{ color: "#8585A8" }}>
                Meminta izin kamera…
              </p>
            </div>
          )}

          {/* ── PERMISSION DENIED / ERROR ── */}
          {(scanState === "permission-denied" || scanState === "error") && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              <div className="w-16 h-16 rounded-[22px] flex items-center justify-center"
                   style={{ background: "rgba(252,165,165,0.10)", border: "1px solid rgba(252,165,165,0.20)" }}>
                <CameraOff size={28} className="text-[#FCA5A5]" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold mb-2 text-[#FCA5A5]">
                  {scanState === "permission-denied" ? "Izin Ditolak" : "Error Kamera"}
                </p>
                <p className="text-[12px] leading-relaxed max-w-[250px] mx-auto" style={{ color: "#8585A8" }}>
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => { setScanState("idle"); setErrorMessage(""); }}
                className="fab flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer"
                style={{ color: "#B9B9F1" }}
              >
                <RefreshCw size={13} />
                Coba Lagi
              </button>
            </div>
          )}

          {/* ── PREVIEWING ── */}
          {scanState === "previewing" && (
            <>
              <div className="relative flex-1 rounded-[26px] overflow-hidden bg-black"
                   style={{ border: "1px solid rgba(185,185,241,0.10)" }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline muted
                  aria-label="Pratinjau kamera"
                />
                {/* Corner guides */}
                {[
                  "top-3 left-3 border-t-2 border-l-2 rounded-tl-xl",
                  "top-3 right-3 border-t-2 border-r-2 rounded-tr-xl",
                  "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl",
                  "bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 pointer-events-none ${cls}`}
                       style={{ borderColor: "rgba(130,148,255,0.65)" }} />
                ))}
                {/* Scan line */}
                <div className="absolute left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[rgba(130,148,255,0.7)] to-transparent scan-line pointer-events-none" />
                {/* Guide pill */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                       style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(185,185,241,0.18)" }}>
                    <ScanLine size={10} className="text-[#8294FF]" />
                    <span className="text-[10px] font-medium text-[#B9B9F1]/70">
                      Arahkan ke dokumen Braille
                    </span>
                  </div>
                </div>
              </div>

              {/* Capture controls */}
              <div className="flex items-center justify-center gap-6 py-1">
                <button
                  onClick={reset}
                  className="w-10 h-10 rounded-full fab flex items-center justify-center cursor-pointer"
                  aria-label="Tutup kamera"
                >
                  <CameraOff size={15} className="text-[#8585A8]" />
                </button>
                {/* Main shutter */}
                <button
                  onClick={captureFrame}
                  aria-label="Tangkap gambar"
                  className="w-[68px] h-[68px] rounded-full fab-primary flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center"
                       style={{ background: "rgba(255,255,255,0.15)" }}>
                    <Camera size={20} className="text-white" />
                  </div>
                </button>
                <div className="w-10 h-10" />
              </div>
            </>
          )}

          {/* ── CAPTURING / PROCESSING ── */}
          {(scanState === "capturing" || scanState === "processing") && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              {capturedImage && (
                <div className="w-full max-h-[280px] rounded-[22px] overflow-hidden"
                     style={{ border: "1px solid rgba(185,185,241,0.10)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={capturedImage} alt="Gambar yang ditangkap"
                       className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[rgba(130,148,255,0.25)] border-t-[#8294FF] animate-spin" />
                <p className="text-[13px] font-medium" style={{ color: "#8585A8" }}>
                  {scanState === "capturing" ? "Memproses tangkapan…" : "Memeriksa konten…"}
                </p>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {scanState === "result" && capturedImage && (
            <>
              {/* Captured image */}
              <div className="relative rounded-[22px] overflow-hidden shrink-0"
                   style={{ height: 200, border: "1px solid rgba(185,185,241,0.10)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={capturedImage} alt="Gambar Braille yang ditangkap"
                     className="w-full h-full object-contain bg-black" />
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full backdrop-blur-sm"
                     style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(185,185,241,0.18)" }}>
                  <ImageIcon size={9} className="text-[#8585A8]" />
                  <span className="text-[9px] font-medium text-[#8585A8]">Gambar Tersimpan</span>
                </div>
              </div>

              {/* Result panel — lavender float */}
              <div className="lavender-panel rounded-[26px] p-4 flex-1 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center"
                       style={{ background: "rgba(252,211,77,0.15)", border: "1px solid rgba(252,211,77,0.25)" }}>
                    <AlertTriangle size={12} className="text-[#FCD34D]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#8585A8]">
                    Status Pengenalan
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-[#6EE7B7]" />
                    <span className="text-[10px] font-semibold text-[#6EE7B7]">Foto OK</span>
                  </div>
                </div>

                <p className="text-[12px] leading-relaxed flex-1 text-[#5A5A80]">
                  {RECOGNITION_NOTE}
                </p>

                {/* Action FABs */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSpeak}
                    aria-label={isSpeaking ? "Hentikan audio" : "Dengarkan keterangan"}
                    className={`w-9 h-9 rounded-full fab flex items-center justify-center cursor-pointer ${
                      isSpeaking ? "border-[rgba(130,148,255,0.5)] bg-[rgba(130,148,255,0.18)]" : ""
                    }`}
                  >
                    {isSpeaking
                      ? <VolumeX size={14} className="text-[#B9B9F1]" />
                      : <Volume2 size={14} className="text-[#8585A8]" />}
                  </button>

                  <button
                    onClick={handleCopy}
                    aria-label="Salin keterangan"
                    className="w-9 h-9 rounded-full fab flex items-center justify-center cursor-pointer"
                  >
                    {copyFeedback
                      ? <CheckCircle2 size={14} className="text-[#6EE7B7]" />
                      : <Copy size={14} className="text-[#8585A8]" />}
                  </button>

                  <button
                    onClick={reset}
                    aria-label="Scan ulang"
                    className="ml-auto fab-primary flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    Scan Ulang
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-3 z-20 shrink-0">
          <div className="w-[100px] h-[3px] rounded-full bg-[rgba(185,185,241,0.12)]" />
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}
