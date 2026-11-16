"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Segmented, Skeleton } from "antd";
import { FiRefreshCw } from "react-icons/fi";
import { useQueryState } from "nuqs";
import { getFeedbackSummary } from "@/api/feedback";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { percentOfAnswered, type FeedbackSide } from "@/utils/feedbackSummary";

const RANGES = [
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
];

// One stacked bar. Colour is never the only signal: every segment is also labelled in text below.
const Breakdown = ({
  title,
  rows,
  counts,
}: {
  title: string;
  rows: Array<{ key: string; label: string; color: string }>;
  counts: Record<string, number>;
}) => {
  const answered = rows.reduce((sum, r) => sum + (counts[r.key] ?? 0), 0);
  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-dark">{title}</p>
      {answered === 0 ? (
        <p className="mt-1 text-sm text-gray-medium">No one has answered this yet.</p>
      ) : (
        <>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-background" role="img"
            aria-label={rows.map((r) => `${r.label} ${percentOfAnswered(counts[r.key] ?? 0, counts)}%`).join(", ")}>
            {rows.map((r) => (
              <div key={r.key} style={{ width: `${((counts[r.key] ?? 0) / answered) * 100}%`, background: r.color }} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-medium">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />
                {r.label}: {counts[r.key] ?? 0} ({percentOfAnswered(counts[r.key] ?? 0, counts) ?? 0}%)
              </li>
            ))}
            {counts.unanswered ? <li>Skipped: {counts.unanswered}</li> : null}
          </ul>
        </>
      )}
    </div>
  );
};

const SideCard = ({ heading, side }: { heading: string; side: FeedbackSide }) => (
  <section aria-label={heading} className="rounded-2xl border border-stroke bg-white p-5">
    <h2 className="text-lg font-semibold text-dark">{heading}</h2>
    <p className="text-sm text-gray-medium">
      {side.responses} {side.responses === 1 ? "review" : "reviews"}
    </p>
    <Breakdown
      title="Was the session helpful?"
      counts={side.helpful}
      rows={[
        { key: "yes", label: "Yes", color: "#15803D" },
        { key: "no", label: "No", color: "#DC2626" },
      ]}
    />
    <Breakdown
      title="Was the goal addressed?"
      counts={side.goal_addressed}
      rows={[
        { key: "yes", label: "Yes", color: "#15803D" },
        { key: "partly", label: "Partly", color: "#A16207" },
        { key: "no", label: "No", color: "#DC2626" },
      ]}
    />
  </section>
);

// Counts only (no names or free text), so recurring problems stand out without reading reviews one by one.
export default function SessionFeedbackPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [days, setDays] = useQueryState("days", { defaultValue: "90" });

  useEffect(() => {
    setHeaderOptions({ title: "Session Feedback", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["feedback-summary", days],
    queryFn: () => getFeedbackSummary(Number(days)),
    staleTime: 60 * 1000,
  });

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented options={RANGES} value={days} onChange={(v) => setDays(String(v))} aria-label="Time range" />
        <Button icon={<FiRefreshCw aria-hidden />} onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : isError || !data ? (
        <div role="alert" className="rounded-xl border border-stroke bg-white p-4 text-sm text-dark">
          {getApiErrorMessage(error, "Couldn't load the feedback summary.")}{" "}
          <Button size="small" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : data.learner.responses + data.volunteer.responses === 0 ? (
        <p className="text-dark">No session feedback in the last {data.days} days.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SideCard heading="Learners" side={data.learner} />
          <SideCard heading="Volunteers" side={data.volunteer} />
        </div>
      )}
    </div>
  );
}
