"use client";

import React from "react";
import Link from "next/link";
import { Button, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FiAlertCircle, FiDownload, FiExternalLink, FiFileText, FiFile } from "react-icons/fi";
import { StatusTag } from "@/components/safety/SeverityTag";
import { useSafetyReportStatus } from "@/hooks/useSafetyReportStatus";
import { isInFlight } from "@/components/safety/severity";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { GOOGLE_DOC_MIME, mimeLabel, type DriveFile } from "./driveHelpers";

/** What happened the last time this file was imported from this page. */
export type ImportEntry =
  | { state: "importing" }
  | { state: "success"; reportId: number }
  | { state: "error"; message: string };

const ImportedReport = ({ reportId }: { reportId: number }) => {
  const statusQuery = useSafetyReportStatus(reportId);
  const status = statusQuery.data;
  return (
    <div className="flex flex-col items-end gap-1 text-right">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status ? <StatusTag status={status.status} /> : null}
        <Link href={`/safety/report/${reportId}`} className="text-sm font-medium text-blue-600 hover:underline">
          {status && !isInFlight(status.status) ? `Open report #${reportId}` : `View report #${reportId}`}
        </Link>
      </div>
      {status?.status?.toUpperCase() === "FAILED" && status.error_message ? (
        <span className="text-xs text-red-600 max-w-[260px]">{status.error_message}</span>
      ) : null}
      {statusQuery.isError && !status ? (
        <span className="text-xs text-gray-500">Couldn&apos;t check the analysis status. Open the report to see it.</span>
      ) : null}
    </div>
  );
};

interface DriveFileTableProps {
  files: DriveFile[];
  imports: Record<string, ImportEntry>;
  onImport: (file: DriveFile) => void;
}

export default function DriveFileTable({ files, imports, onImport }: DriveFileTableProps) {
  const columns: ColumnsType<DriveFile> = [
    {
      title: "File",
      dataIndex: "name",
      key: "name",
      render: (name: string, file) => {
        const Icon = file.mimeType === GOOGLE_DOC_MIME ? FiFileText : FiFile;
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Icon aria-hidden="true" className="shrink-0 text-gray-500" />
            <span className="truncate max-w-[280px] font-medium text-gray-900" title={name}>
              {name}
            </span>
            {file.webViewLink ? (
              <Tooltip title="Open in Google Drive">
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${name} in Google Drive (opens in a new tab)`}
                  className="shrink-0 text-gray-400 hover:text-blue-600"
                >
                  <FiExternalLink aria-hidden="true" />
                </a>
              </Tooltip>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "mimeType",
      key: "mimeType",
      render: (mime: string) => <span className="text-gray-600 whitespace-nowrap">{mimeLabel(mime)}</span>,
    },
    {
      title: "Last modified",
      dataIndex: "modifiedTime",
      key: "modifiedTime",
      render: (value: string | null) => <span className="text-gray-600 whitespace-nowrap">{formatDisplayDateTime(value)}</span>,
    },
    {
      title: "Analysis",
      key: "action",
      align: "right",
      render: (_: unknown, file) => {
        const entry = imports[file.id];
        if (entry?.state === "success") {
          return (
            <div className="flex flex-col items-end gap-1">
              <ImportedReport reportId={entry.reportId} />
              <Button type="link" size="small" className="!p-0 !h-auto" onClick={() => onImport(file)}>
                Import again
              </Button>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-end gap-1">
            <Button
              type="primary"
              icon={<FiDownload aria-hidden="true" />}
              loading={entry?.state === "importing"}
              onClick={() => onImport(file)}
              aria-label={`Import ${file.name} for analysis`}
            >
              {entry?.state === "importing" ? "Importing" : entry?.state === "error" ? "Try again" : "Import for analysis"}
            </Button>
            {entry?.state === "error" ? (
              <span role="alert" className="flex items-start gap-1 text-xs text-red-600 max-w-[260px] text-right">
                <FiAlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />
                {entry.message}
              </span>
            ) : null}
          </div>
        );
      },
    },
  ];

  return <Table<DriveFile> rowKey="id" columns={columns} dataSource={files} pagination={false} scroll={{ x: "max-content" }} />;
}
