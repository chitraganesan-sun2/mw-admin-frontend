import clsx from "clsx";
import type { ReactNode } from "react";
import { TONES, type ToneName } from "@/theme/tokens";
import { toneFromColor, toneFromStatus } from "@/utils/statusTone";

interface StatusTagProps {
  children: ReactNode;
  /** Explicit tone. Wins over `status` and `color`. */
  tone?: ToneName;
  /** A domain status ("pending", "verification_completed", ...) to derive the tone from. */
  status?: string | null;
  /** Legacy antd preset colour name ("green", "gold", "red", ...), mapped onto a tone. */
  color?: string | null;
  /** Show the small status dot before the label (used for table status cells). */
  dot?: boolean;
  className?: string;
  title?: string;
}

/**
 * The one way a status, category or read-only fact is drawn in the admin console: 6px radius, 12/500,
 * AA text on its tint (the old antd preset tags were 2.76:1 / 3.37:1). Neutral is for information that is not a
 * status or an action, so it never looks like a button.
 */
const StatusTag = ({ children, tone, status, color, dot = false, className, title }: StatusTagProps) => {
  const name: ToneName = tone ?? (status != null ? toneFromStatus(status) : toneFromColor(color));
  const t = TONES[name];
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex h-6 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-xs font-medium leading-none",
        className
      )}
      style={{ color: t.fg, background: t.bg, borderColor: t.border }}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.dot }} aria-hidden /> : null}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default StatusTag;
