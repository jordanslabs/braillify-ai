/* ═══════════════════════════════════════════════════════════════
   Braillify-AI — Theme Constants
   Design System: Futuristic Soft-Tech (Glassmorphism + Neumorphism)
   ═══════════════════════════════════════════════════════════════ */

export const COLORS = {
  // Core backgrounds
  bg: "#09111F",
  surface: "#111C2D",
  surfaceAlt: "#0F1929",
  surfaceElevated: "#162035",

  // Primary palette
  primary: "#2563EB",
  primaryLight: "#60A5FA",
  primaryDark: "#1D4ED8",
  lavender: "#C4B5FD",
  lavenderDim: "#A78BFA",

  // Text
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textDim: "#475569",

  // Accent & status
  cyan: "#22D3EE",
  cyanDim: "rgba(34, 211, 238, 0.15)",
  green: "#34D399",
  greenDim: "rgba(52, 211, 153, 0.15)",
  red: "#F87171",
  redDim: "rgba(248, 113, 113, 0.15)",
  amber: "#FBBF24",
  amberDim: "rgba(251, 191, 36, 0.15)",

  // Borders & overlays
  border: "#26354B",
  borderLight: "rgba(148, 163, 184, 0.12)",
  borderFocus: "rgba(37, 99, 235, 0.5)",
  glass: "rgba(17, 28, 45, 0.75)",
  glassBorder: "rgba(148, 163, 184, 0.08)",
  overlay: "rgba(9, 17, 31, 0.6)",
} as const;

export const RADIUS = {
  xs: "6px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  xxl: "24px",
  pill: "9999px",
  phone: "44px",
} as const;

export const SHADOWS = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.3)",
  md: "0 4px 12px rgba(0, 0, 0, 0.3)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.4)",
  glow: (color: string, intensity = 0.3) =>
    `0 0 16px rgba(${color}, ${intensity})`,
  phone:
    "0 0 60px rgba(37, 99, 235, 0.06), 0 0 120px rgba(99, 102, 241, 0.04), 0 25px 80px rgba(0, 0, 0, 0.5)",
  neuInset:
    "inset 2px 2px 4px rgba(0, 0, 0, 0.4), inset -1px -1px 3px rgba(99, 102, 241, 0.12)",
  neuInsetInactive:
    "inset 1px 1px 3px rgba(0, 0, 0, 0.25), inset -1px -1px 2px rgba(148, 163, 184, 0.04)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT = {
  xs: "10px",
  sm: "11px",
  base: "13px",
  md: "14px",
  lg: "16px",
  xl: "18px",
  xxl: "22px",
  title: "15px",
} as const;
