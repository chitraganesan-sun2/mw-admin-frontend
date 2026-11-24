// Design tokens for the admin console, as plain values (no imports) so the antd theme, the unit tests and
// non-React helpers can all read the same source. The CSS variables in globals.css and the Tailwind colours
// mirror these; change a value here and there together.
//
// Every foreground/background pair in TONES is asserted >= 4.5:1 in tests/unit/contrast.test.ts.

export const BRAND = "#09BAEE";
/** Brand cyan as TEXT or a thin UI line on white: 6.1:1 (the cyan itself is 2.27:1 and fails AA as text). */
export const BRAND_INK = "#046A8A";
export const BRAND_TINT = "#E0F7FE";
/** Text that sits ON a brand-cyan fill (8.3:1). Never white on cyan (2.27:1). */
export const ON_BRAND = "#121212";

export const INK = "#121212";
export const INK_2 = "#4F4F4F"; // secondary text, 7.9:1 on white
export const INK_3 = "#667085"; // meta / placeholder, 5.0:1 on white, 4.6:1 on the canvas (#6B7280 is 4.50 on the canvas: too tight)
export const LINE = "#E0E0E0";
export const LINE_SOFT = "#EEF1F5";
export const CANVAS = "#F4F7FB";
export const SURFACE = "#FFFFFF";
export const TABLE_HEAD = "#F8FAFC";
export const ROW_HOVER = "#F5FBFE";

export type ToneName = "success" | "warning" | "danger" | "info" | "neutral";

/** Text-on-tint pairs for status tags, alerts and chips. fg/bg contrast is >= 4.5:1; dot is the small marker colour. */
export const TONES: Record<ToneName, { fg: string; bg: string; border: string; dot: string }> = {
  success: { fg: "#15803D", bg: "#DCFCE7", border: "#BBF7D0", dot: "#16A34A" },
  warning: { fg: "#92400E", bg: "#FEF3C7", border: "#FDE68A", dot: "#D97706" },
  danger: { fg: "#B91C1C", bg: "#FEE2E2", border: "#FECACA", dot: "#DC2626" },
  info: { fg: BRAND_INK, bg: BRAND_TINT, border: "#B6E8F8", dot: BRAND },
  neutral: { fg: INK_2, bg: "#F3F4F6", border: "#E5E7EB", dot: "#9CA3AF" },
};

export const RADIUS = { control: 12, controlSm: 8, card: 16, modal: 24, tag: 6 } as const;
export const CONTROL_HEIGHT = { sm: 32, md: 40, lg: 44 } as const;
