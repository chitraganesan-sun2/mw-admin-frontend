"use client";

import React from "react";
import { Button, Skeleton } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiActivity, FiAlertCircle, FiClock, FiFileText, FiPlay, FiSquare } from "react-icons/fi";
import { getDriveWatcher, startDriveWatcher, stopDriveWatcher } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";

export const WATCHER_QUERY_KEY = ["safety-drive-watcher"];
const WATCHER_POLL_MS = 15_000;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const Stat = ({ icon, children, tone }: { icon: React.ReactNode; children: React.ReactNode; tone?: "bad" }) => (
  <span className={`inline-flex items-center gap-1.5 text-sm ${tone === "bad" ? "text-red-600" : "text-gray-600"}`}>
    <span aria-hidden="true">{icon}</span>
    {children}
  </span>
);

export default function DriveWatcherPanel() {
  const queryClient = useQueryClient();

  // Polled only while the tab is visible (react-query pauses interval refetches in the background).
  const watcherQuery = useQuery({
    queryKey: WATCHER_QUERY_KEY,
    queryFn: getDriveWatcher,
    refetchInterval: WATCHER_POLL_MS,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const toggleMutation = useMutation({
    mutationFn: (start: boolean) => (start ? startDriveWatcher() : stopDriveWatcher()),
    onSuccess: (result) => {
      queryClient.setQueryData(WATCHER_QUERY_KEY, result.status);
      showToast({ type: "success", message: result.message });
    },
    onError: (err, start) => {
      showToast({
        type: "error",
        message: getApiErrorMessage(err, start ? "Couldn't start the watcher. Please try again." : "Couldn't stop the watcher. Please try again."),
      });
    },
  });

  const watcher = watcherQuery.data;

  return (
    <section
      aria-labelledby="drive-watcher-heading"
      className={`bg-white border border-gray-200 rounded-xl p-4 sm:p-5 border-l-4 ${
        watcher?.running ? "border-l-emerald-500" : "border-l-gray-300"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="drive-watcher-heading" className="text-base font-semibold text-gray-900 m-0">
            Auto-import watcher
            {watcher ? (
              <span className={`ml-2 text-sm font-medium ${watcher.running ? "text-emerald-600" : "text-gray-500"}`}>
                {watcher.running ? "Running" : "Stopped"}
              </span>
            ) : null}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            When running, new files in the connected Drive are imported and analysed automatically. This is shared by
            everyone who uses Safety Monitoring.
          </p>
        </div>

        {watcher ? (
          <Button
            type={watcher.running ? "default" : "primary"}
            icon={watcher.running ? <FiSquare aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
            loading={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate(!watcher.running)}
          >
            {watcher.running ? "Stop watcher" : "Start watcher"}
          </Button>
        ) : null}
      </div>

      <div className="mt-3">
        {watcherQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} title={false} aria-label="Loading watcher status" />
        ) : watcherQuery.isError ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-red-600">
            <FiAlertCircle aria-hidden="true" />
            <span>{getApiErrorMessage(watcherQuery.error, "Couldn't load the watcher status.")}</span>
            <Button size="small" onClick={() => watcherQuery.refetch()} loading={watcherQuery.isFetching}>
              Try again
            </Button>
          </div>
        ) : watcher ? (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Stat icon={<FiClock />}>Checks every {watcher.poll_interval_seconds}s</Stat>
            <Stat icon={<FiFileText />}>{plural(watcher.files_processed, "file")} processed</Stat>
            {watcher.errors > 0 ? (
              <Stat icon={<FiAlertCircle />} tone="bad">
                {plural(watcher.errors, "error")}
              </Stat>
            ) : null}
            <Stat icon={<FiActivity />}>
              {watcher.last_checked ? `Last checked ${formatDisplayDateTime(watcher.last_checked)}` : "Hasn't checked yet"}
            </Stat>
          </div>
        ) : null}
      </div>
    </section>
  );
}
