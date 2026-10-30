"use client";

import React from "react";
import Link from "next/link";
import { Button, Progress, Spin, Tag, Tooltip } from "antd";
import { useQuery } from "@tanstack/react-query";
import { MdAudiotrack, MdClose, MdDescription, MdRefresh, MdVideocam } from "react-icons/md";
import { getSafetyReport } from "@/api/safety";
import { useSafetyReportStatus } from "@/hooks/useSafetyReportStatus";
import { SeverityTag, StatusTag } from "../SeverityTag";
import { formatRisk } from "../severity";
import { KIND_LABELS, QueueItem, UploadKind, formatBytes } from "./uploadRules";

const KIND_ICONS: Record<UploadKind, React.ReactNode> = {
  audio: <MdAudiotrack size={22} aria-hidden="true" />,
  video: <MdVideocam size={22} aria-hidden="true" />,
  "transcript-file": <MdDescription size={22} aria-hidden="true" />,
  "transcript-text": <MdDescription size={22} aria-hidden="true" />,
};

/** Live state of a report the pipeline accepted: Analysing, then Completed with severity or Failed. */
function AcceptedStatus({ reportId }: { reportId: number }) {
  const status = useSafetyReportStatus(reportId);
  const finished = status.data?.status?.toUpperCase() === "COMPLETED";

  // Severity and score only exist on the full report, so fetch it once the analysis is done.
  const report = useQuery({
    queryKey: ["safety-upload-result", reportId],
    queryFn: () => getSafetyReport(reportId),
    enabled: finished,
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status.isError && !status.data ? (
        <>
          <span className="text-sm text-red-600">Couldn&apos;t check the analysis status.</span>
          <Button size="small" onClick={() => status.refetch()} loading={status.isFetching}>
            Retry
          </Button>
        </>
      ) : (
        <>
          <StatusTag status={status.data?.status ?? "PROCESSING"} />
          {finished && report.data && (
            <>
              <SeverityTag severity={report.data.severity} />
              <span className="text-sm text-gray-600">Risk score {formatRisk(report.data.risk_score)}</span>
            </>
          )}
          {finished && report.isError && (
            <Button size="small" onClick={() => report.refetch()} loading={report.isFetching}>
              Retry loading result
            </Button>
          )}
          {status.data?.status?.toUpperCase() === "FAILED" && (
            <span className="text-sm text-red-600">
              {status.data.error_message || "The analysis failed on the server."}
            </span>
          )}
        </>
      )}
      <Link href={`/safety/report/${reportId}`} className="text-sm font-medium underline">
        View report #{reportId}
      </Link>
    </div>
  );
}

interface UploadQueueItemProps {
  item: QueueItem;
  onRemove: (key: string) => void;
  onRetry: (key: string) => void;
}

export default function UploadQueueItem({ item, onRemove, onRetry }: UploadQueueItemProps) {
  const isUploading = item.status === "uploading";
  const isTextOnly = item.kind === "transcript-text";
  const removeLabel =
    item.status === "accepted" ? `Dismiss ${item.name}` : item.status === "waiting" && item.started
      ? `Cancel ${item.name}`
      : `Remove ${item.name}`;

  return (
    <li className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-500 mt-1">{KIND_ICONS[item.kind]}</span>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-gray-900 break-all">{item.name}</span>
          <Tag className="m-0">{KIND_LABELS[item.kind]}</Tag>
          <span className="text-sm text-gray-500">{formatBytes(item.size)}</span>
        </div>

        <div className="mt-1">
          {item.status === "waiting" && (
            <span className="text-sm text-gray-600">{item.started ? "Waiting for a free upload slot" : "Ready to start"}</span>
          )}

          {isUploading &&
            (isTextOnly ? (
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Spin size="small" /> Submitting
              </span>
            ) : (
              <Progress
                percent={item.progress}
                size="small"
                status="active"
                aria-label={`Uploading ${item.name}`}
                format={(percent) => `${percent ?? 0}%`}
              />
            ))}

          {item.status === "failed" && (
            <p role="alert" className="text-sm text-red-600 m-0">
              {item.error || "Couldn't upload this file."}
            </p>
          )}

          {item.status === "accepted" && item.reportId != null && <AcceptedStatus reportId={item.reportId} />}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {item.status === "failed" && (
          <Button size="small" icon={<MdRefresh aria-hidden="true" />} onClick={() => onRetry(item.key)}>
            Retry
          </Button>
        )}
        <Tooltip title={isUploading ? "Can't be cancelled once the upload has started" : undefined}>
          <Button
            type="text"
            size="small"
            disabled={isUploading}
            aria-label={removeLabel}
            icon={<MdClose aria-hidden="true" />}
            onClick={() => onRemove(item.key)}
          />
        </Tooltip>
      </div>
    </li>
  );
}
