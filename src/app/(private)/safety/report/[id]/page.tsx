"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Alert, Progress, Skeleton, Tabs } from "antd";
import { getSafetyReport } from "@/api/safety";
import { useSafetyReportStatus } from "@/hooks/useSafetyReportStatus";
import { useComponentStore } from "@/store/useComponenetStore";
import { getHeaderIcon } from "@/layouts/helper";
import { getApiErrorMessage } from "@/utils/apiError";
import SafetyTabs from "@/components/safety/SafetyTabs";
import { isInFlight } from "@/components/safety/severity";
import Chatbot from "@/components/safety/Chatbot";
import AnalyticsTab from "@/components/safety/report/AnalyticsTab";
import EvidenceTab from "@/components/safety/report/EvidenceTab";
import FindingsTab from "@/components/safety/report/FindingsTab";
import OverviewTab from "@/components/safety/report/OverviewTab";
import RawDataTab from "@/components/safety/report/RawDataTab";
import ReportHeader from "@/components/safety/report/ReportHeader";
import TimelineTab from "@/components/safety/report/TimelineTab";
import TranscriptTab from "@/components/safety/report/TranscriptTab";
import { PageProblem } from "@/components/safety/report/parts";
import { buildReportModel } from "@/components/safety/report/helpers";

const isNotFound = (err: unknown) => (err as { status?: number } | null)?.status === 404;

function LoadingState() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading report">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SafetyReportPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = String(rawId ?? "");
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setHeaderOptions({ title: "Safety Monitoring", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const validId = /^\d+$/.test(id);

  const reportQuery = useQuery({
    queryKey: ["safety-report", id],
    queryFn: () => getSafetyReport(id),
    enabled: validId,
    retry: (count, err) => !isNotFound(err) && count < 1,
  });
  const report = reportQuery.data;

  // While the pipeline is still analysing, poll the cheap status endpoint and fetch the full report
  // once it finishes (the old dashboard used an unauthenticated WebSocket for this).
  const inFlight = isInFlight(report?.status);
  const statusQuery = useSafetyReportStatus(id, validId && inFlight);
  const finishedStatus = statusQuery.data?.status;
  const { refetch } = reportQuery;
  useEffect(() => {
    if (inFlight && finishedStatus && !isInFlight(finishedStatus)) refetch();
  }, [inFlight, finishedStatus, refetch]);

  const model = useMemo(() => (report ? buildReportModel(report) : null), [report]);
  const flaggedItems = useMemo(() => (model ? [...model.evidence, ...model.findings] : []), [model]);

  let body: React.ReactNode;
  if (!validId) {
    body = <PageProblem status="404" title="Report not found" subTitle="This link doesn't point to a safety report." />;
  } else if (reportQuery.isLoading) {
    body = <LoadingState />;
  } else if (reportQuery.isError) {
    body = isNotFound(reportQuery.error) ? (
      <PageProblem status="404" title="Report not found" subTitle="It may have been deleted, or the link is wrong." />
    ) : (
      <PageProblem
        status="error"
        title="Couldn't load this report"
        subTitle={getApiErrorMessage(reportQuery.error, "The report service didn't respond. Try again in a moment.")}
        onRetry={() => reportQuery.refetch()}
      />
    );
  } else if (report && model) {
    const completed = String(report.status).toUpperCase() === "COMPLETED";
    const failed = String(report.status).toUpperCase() === "FAILED";

    body = (
      <>
        <ReportHeader report={report} chatOpen={chatOpen} onToggleChat={() => setChatOpen((open) => !open)} />

        {inFlight && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-3" role="status" aria-live="polite">
            <h2 className="text-base font-semibold text-gray-800">Analysis in progress</h2>
            <Progress percent={100} status="active" showInfo={false} />
            <p className="text-sm text-gray-600">
              The conversation is still being analysed. This page checks every few seconds and shows the results as soon as they are ready, so you can leave it open.
            </p>
            {statusQuery.isError && (
              <Alert type="warning" showIcon message="Couldn't check the progress just now. Still trying." />
            )}
          </div>
        )}

        {failed && (
          <Alert
            type="error"
            showIcon
            message="This analysis failed"
            description={report.error_message?.trim() || "The pipeline did not say why. You can delete this report and submit the conversation again."}
          />
        )}

        {!inFlight && !completed && !failed && (
          <Alert type="info" showIcon message={`This report has status "${report.status}", so its results can't be shown.`} />
        )}

        {completed && (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
            <div className="min-w-0 xl:order-first">
              <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
                {[
                  ["Findings", model.findings.length],
                  ["Evidence items", model.evidence.length],
                  ["Words analysed", typeof model.stats.word_count === "number" ? model.stats.word_count : "-"],
                  ["Risk categories", model.categoryCounts.length],
                  ["Timeline segments", model.timeline.length],
                  ["Severity", report.severity ?? "-"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="text-lg font-semibold text-gray-800">{value}</dd>
                  </div>
                ))}
              </dl>

              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                destroyInactiveTabPane
                items={[
                  { key: "overview", label: "Overview", children: <OverviewTab report={report} model={model} /> },
                  { key: "findings", label: `Findings (${model.findings.length})`, children: <FindingsTab findings={model.findings} /> },
                  { key: "evidence", label: `Evidence (${model.evidence.length})`, children: <EvidenceTab evidence={model.evidence} /> },
                  { key: "transcript", label: "Transcript", children: <TranscriptTab transcript={report.transcript ?? ""} items={flaggedItems} /> },
                  {
                    key: "timeline",
                    label: `Timeline (${model.timeline.length})`,
                    children: <TimelineTab timeline={model.timeline} transcript={report.transcript ?? ""} flagged={flaggedItems} />,
                  },
                  { key: "analytics", label: "Analytics", children: <AnalyticsTab report={report} model={model} /> },
                  { key: "raw", label: "Raw data", children: <RawDataTab report={report} /> },
                ]}
              />
            </div>

            {chatOpen && (
              <aside className="order-first xl:order-last xl:sticky xl:top-4 min-w-0" aria-label="Report chat">
                <Chatbot key={report.id} reportId={report.id} />
              </aside>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <SafetyTabs />
      {body}
    </div>
  );
}
