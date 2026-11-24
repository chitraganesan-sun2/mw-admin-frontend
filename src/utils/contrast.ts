// WCAG 2.x contrast maths, used by the tests that guard the design tokens (AA text needs 4.5:1, large text and
// UI parts 3:1). No imports, so node can run it directly.

const channel = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/** "#RGB" / "#RRGGBB" to [r, g, b] (0-255), or null when it is not a hex colour. */
export const parseHex = (hex: string): [number, number, number] | null => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const relativeLuminance = (hex: string): number => {
  const rgb = parseHex(hex);
  if (!rgb) return NaN;
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
};

/** Contrast ratio between two hex colours, 1 (identical) to 21 (black on white); NaN for an invalid colour. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};

export const meetsAA = (fg: string, bg: string, large = false): boolean =>
  contrastRatio(fg, bg) >= (large ? 3 : 4.5);
