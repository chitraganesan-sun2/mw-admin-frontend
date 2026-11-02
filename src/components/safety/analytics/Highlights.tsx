"use client";

import { FiArrowDownRight, FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import type { Highlight } from "./analyticsData";

const TONE = {
  good: { fg: "#047857", bg: "#ECFDF5" },
  bad: { fg: "#B91C1C", bg: "#FEF2F2" },
  neutral: { fg: "#4B5563", bg: "#F3F4F6" },
} as const;

const ICON = { up: FiArrowUpRight, down: FiArrowDownRight, flat: FiArrowRight } as const;

/** A row of plain-language takeaways, so the page answers "what should I know?" before it shows any chart. */
export default function Highlights({ items }: { items: Highlight[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="At a glance" className="rounded-2xl border border-stroke bg-white p-4 sm:p-5">
      <h3 className="m-0 mb-3 text-base font-semibold text-dark">At a glance</h3>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = TONE[item.tone];
          const Icon = item.direction ? ICON[item.direction] : null;
          return (
            <li key={item.key} className="min-w-0 rounded-xl bg-[#F8FAFC] px-3.5 py-3">
              <div className="text-xs font-medium text-[#6B7280]">{item.label}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 truncate text-xl font-semibold text-dark" title={item.value}>
                  {item.value}
                </span>
                {Icon ? (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: tone.bg, color: tone.fg }}
                    aria-hidden="true"
                  >
                    <Icon size={14} />
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-xs leading-snug text-[#4F4F4F]">{item.hint}</div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
