// Which tone a status or an antd preset colour name draws as. Kept pure (no React) so the mapping is tested.
// Tones are the AA text-on-tint pairs in src/theme/tokens.ts.
import type { ToneName } from "../theme/tokens.ts";

// The preset colour names pages used to pass to antd's <Tag color="...">.
const COLOR_TONE: Record<string, ToneName> = {
  green: "success",
  success: "success",
  gold: "warning",
  orange: "warning",
  yellow: "warning",
  warning: "warning",
  red: "danger",
  volcano: "danger",
  magenta: "danger",
  error: "danger",
  blue: "info",
  cyan: "info",
  geekblue: "info",
  purple: "info",
  processing: "info",
  default: "neutral",
};

/** antd preset colour name -> tone; anything unknown (or no colour) is neutral. */
export const toneFromColor = (color?: string | null): ToneName =>
  (color && COLOR_TONE[String(color).toLowerCase()]) || "neutral";

const STATUS_TONE: Record<string, ToneName> = {
  // went well
  accepted: "success",
  active: "success",
  approved: "success",
  completed: "success",
  resolved: "success",
  notified: "success",
  delivered: "success",
  sent: "success",
  verification_completed: "success",
  // waiting on someone
  pending: "warning",
  verification_pending: "warning",
  partially_filled: "warning",
  in_progress: "warning",
  // went wrong / closed negatively
  rejected: "danger",
  declined: "danger",
  failed: "danger",
  disabled: "danger",
  error: "danger",
  verification_rejected: "danger",
  // informational
  details_pending: "info",
  processing: "info",
  new: "info",
  // quiet
  expired: "neutral",
  cancelled: "neutral",
  canceled: "neutral",
  hidden: "neutral",
};

/** A domain status string ("pending", "verification_completed", ...) -> tone; unknown statuses are neutral. */
export const toneFromStatus = (status?: string | null): ToneName =>
  STATUS_TONE[String(status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_")] ?? "neutral";
