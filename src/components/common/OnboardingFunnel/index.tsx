"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/constants";
import { GET_API } from "@/api/request";
import { useCan } from "@/hooks/useStaff";

type Role = "learner" | "volunteer";

interface FunnelRole {
  total: number;
  total_steps: number;
  by_status: Record<string, number>;
  incomplete: {
    total: number;
    not_started: number;
    started_no_step_saved: number;
    by_step: Record<string, number>;
    idle: Record<string, number>;
  };
}

const STATUS_LABEL: Record<string, string> = {
  details_pending: "Form Incomplete (not started)",
  partially_filled: "Form Incomplete (started)",
  verification_pending: "Approval Pending",
  verification_completed: "Completed",
  verification_rejected: "Rejected",
};

// One simple horizontal bar per row; the widest row in a group is 100%.
const Bars = ({ rows, tone }: { rows: { label: string; value: number }[]; tone: string }) => {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3 text-sm">
          <span className="w-44 shrink-0 text-ink-2">{row.label}</span>
          <span className="h-2.5 flex-1 rounded bg-gray-100" aria-hidden="true">
            <span className={`block h-2.5 rounded ${tone}`} style={{ width: `${(row.value / max) * 100}%` }} />
          </span>
          <span className="w-8 shrink-0 text-right font-medium tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * "Where do sign-ups stall?" - aggregate counts only (no names or contact details leave the server): the whole
 * pipeline by status, and for people who never submitted the form how many never started, which step they stopped
 * at, and how long they have been idle. Collapsed by default so it doesn't push the list down.
 */
export default function OnboardingFunnel({ role }: { role: Role }) {
  const canSee = useCan("applications.review");
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["onboarding-funnel"],
    queryFn: async () => {
      const res: any = await GET_API(endpoints.onboarding.funnel);
      return res?.data as Record<Role, FunnelRole>;
    },
    enabled: canSee && open,
    staleTime: 60_000,
  });

  if (!canSee) return null;
  const funnel = data?.[role];
  const noun = role === "learner" ? "learners" : "volunteers";

  return (
    <section className="mb-4 rounded-2xl border border-stroke bg-white p-4" aria-label={`Sign-up funnel for ${noun}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left text-base font-medium"
      >
        <span>Where {noun} stall while signing up</span>
        <span className="text-sm text-brand-ink underline">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-5">
          {isLoading && <p className="m-0 text-sm text-ink-3">Loading...</p>}
          {isError && <p role="alert" className="m-0 text-sm text-red-700">Couldn&apos;t load the funnel. Please try again.</p>}
          {funnel && (
            <>
              <div>
                <p className="m-0 mb-2 text-sm font-medium">All {funnel.total} {noun}, by status</p>
                <Bars
                  tone="bg-[#4C5B6D]"
                  rows={Object.entries(funnel.by_status).map(([status, value]) => ({
                    label: STATUS_LABEL[status] ?? status,
                    value,
                  }))}
                />
              </div>
              {funnel.incomplete.total > 0 ? (
                <>
                  <div>
                    <p className="m-0 mb-2 text-sm font-medium">
                      Not submitted yet ({funnel.incomplete.total}): the step they stopped at
                    </p>
                    <Bars
                      tone="bg-[#E4833B]"
                      rows={[
                        { label: "Never started", value: funnel.incomplete.not_started },
                        { label: "Started, no step saved", value: funnel.incomplete.started_no_step_saved },
                        ...Object.entries(funnel.incomplete.by_step).map(([step, value]) => ({
                          label: `Stopped at step ${step} of ${funnel.total_steps}`,
                          value,
                        })),
                      ]}
                    />
                  </div>
                  <div>
                    <p className="m-0 mb-2 text-sm font-medium">How long they have been idle</p>
                    <Bars
                      tone="bg-[#8A94A6]"
                      rows={Object.entries(funnel.incomplete.idle)
                        .filter(([bucket]) => bucket !== "unknown" || funnel.incomplete.idle.unknown > 0)
                        .map(([label, value]) => ({ label, value }))}
                    />
                  </div>
                </>
              ) : (
                <p className="m-0 text-sm text-ink-3">Nobody is stuck partway through the form.</p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
