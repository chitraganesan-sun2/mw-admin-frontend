"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Input, Popconfirm, Select, Skeleton } from "antd";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle, FiCheckCircle, FiHardDrive, FiLink, FiRefreshCw, FiSearch, FiWifiOff } from "react-icons/fi";
import {
  disconnectDrive,
  getDriveAuthUrl,
  getDriveStatus,
  importDriveFile,
  listDriveFiles,
} from "@/api/safety";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import SafetyTabs from "@/components/safety/SafetyTabs";
import DriveFileTable, { type ImportEntry } from "@/components/safety/drive/DriveFileTable";
import DriveStatePanel, { RetryButton } from "@/components/safety/drive/DriveStatePanel";
import DriveWatcherPanel, { WATCHER_QUERY_KEY } from "@/components/safety/drive/DriveWatcherPanel";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  describeCallbackReason,
  driveErrorKind,
  isGoogleConsentUrl,
  normaliseDriveFile,
  type DriveFile,
} from "@/components/safety/drive/driveHelpers";

const STATUS_KEY = ["safety-drive-status"];
const FILES_KEY = ["safety-drive-files"];

type CallbackNotice = { type: "success" | "error"; text: string };

function GoogleDriveContent() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [imports, setImports] = useState<Record<string, ImportEntry>>({});
  const [notice, setNotice] = useState<CallbackNotice | null>(null);

  useEffect(() => {
    setHeaderOptions({
      title: "Safety Monitoring",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions, pathname]);

  // Debounced server-side search.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // ── Connection status ──────────────────────────────────────────────────────

  const statusQuery = useQuery({ queryKey: STATUS_KEY, queryFn: getDriveStatus, retry: 1 });
  const connected = statusQuery.data?.authenticated === true;

  // ── Return from Google's consent screen (?auth=success | ?auth=error&reason=...) ──

  const authResult = searchParams.get("auth");
  const authReason = searchParams.get("reason");
  useEffect(() => {
    if (!authResult) return;
    if (authResult === "success") {
      setNotice({ type: "success", text: "Google Drive is connected." });
      showToast({ type: "success", message: "Google Drive is connected." });
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    } else if (authResult === "error") {
      // The reason comes from the URL, so it is only ever rendered as text.
      const text = `Couldn't connect Google Drive. ${describeCallbackReason(authReason)}`;
      setNotice({ type: "error", text });
      showToast({ type: "error", message: text });
    }
    // Clean the query string so a refresh doesn't repeat the message.
    router.replace(pathname);
  }, [authResult, authReason, pathname, router, queryClient]);

  // ── Files ──────────────────────────────────────────────────────────────────

  const filesQuery = useQuery({
    queryKey: [...FILES_KEY, pageSize, search],
    queryFn: async () => {
      const result = await listDriveFiles(pageSize, search || undefined);
      const raw = Array.isArray(result?.files) ? result.files : [];
      return raw.map(normaliseDriveFile).filter((f): f is DriveFile => f !== null);
    },
    enabled: connected,
    placeholderData: keepPreviousData,
    retry: false,
  });

  // The files call answering "not connected" means the connection was lost since the status check.
  const filesErrorKind = filesQuery.isError ? driveErrorKind(filesQuery.error) : null;
  const refetchStatus = statusQuery.refetch;
  useEffect(() => {
    if (filesErrorKind === "not-connected") refetchStatus();
  }, [filesErrorKind, refetchStatus]);

  // ── Connect / disconnect ───────────────────────────────────────────────────

  const connectMutation = useMutation({
    mutationFn: getDriveAuthUrl,
    onSuccess: ({ auth_url }) => {
      if (!isGoogleConsentUrl(auth_url)) {
        showToast({ type: "error", message: "Couldn't start the connection. The sign-in address wasn't recognised." });
        return;
      }
      window.location.assign(auth_url);
    },
    onError: (err) => {
      showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't start the Google Drive connection. Please try again.") });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectDrive,
    onSuccess: () => {
      showToast({ type: "success", message: "Google Drive is disconnected." });
      setImports({});
      queryClient.removeQueries({ queryKey: FILES_KEY });
      queryClient.removeQueries({ queryKey: WATCHER_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
    onError: (err) => {
      showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't disconnect Google Drive. Please try again.") });
    },
  });

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = useCallback(
    async (file: DriveFile) => {
      setImports((prev) => ({ ...prev, [file.id]: { state: "importing" } }));
      try {
        const result = await importDriveFile(file.id, file.name, file.mimeType);
        setImports((prev) => ({ ...prev, [file.id]: { state: "success", reportId: result.id } }));
        showToast({ type: "success", message: `"${file.name}" was imported and is being analysed.` });
      } catch (err) {
        const message = getApiErrorMessage(err, "Couldn't import this file. Please try again.");
        setImports((prev) => ({ ...prev, [file.id]: { state: "error", message } }));
        showToast({ type: "error", message });
        if (driveErrorKind(err) === "not-connected") refetchStatus();
      }
    },
    [refetchStatus]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  const connectButton = (
    <Button
      type="primary"
      icon={<FiLink aria-hidden="true" />}
      loading={connectMutation.isPending}
      onClick={() => connectMutation.mutate()}
    >
      Connect Google Drive
    </Button>
  );

  const files = filesQuery.data ?? [];
  const isRefreshingFiles = filesQuery.isFetching && !filesQuery.isLoading;

  const renderFileList = () => {
    if (filesQuery.isLoading) {
      return (
        <div aria-busy="true" aria-label="Loading files" className="p-4">
          <Skeleton active title={false} paragraph={{ rows: 5 }} />
        </div>
      );
    }
    if (filesQuery.isError) {
      const kind = driveErrorKind(filesQuery.error);
      if (kind === "not-connected") {
        return (
          <DriveStatePanel
            tone="error"
            icon={<FiWifiOff />}
            title="Google Drive isn't connected anymore"
            description="The connection was removed since this page loaded. Connect again to keep importing files."
            actions={connectButton}
          />
        );
      }
      return (
        <DriveStatePanel
          tone="error"
          icon={<FiAlertTriangle />}
          title={kind === "unavailable" ? "The safety service isn't responding" : "Couldn't load files from Google Drive"}
          description={getApiErrorMessage(filesQuery.error, "Something went wrong while loading your files.")}
          actions={<RetryButton onClick={() => filesQuery.refetch()} loading={filesQuery.isFetching} />}
        />
      );
    }
    if (files.length === 0) {
      return (
        <DriveStatePanel
          icon={<FiHardDrive />}
          title={search ? "No files match your search" : "No importable files found"}
          description={
            search
              ? `Nothing in Google Drive matches "${search}". Try a different name.`
              : "Only .txt files and Google Docs owned by the connected account can be imported."
          }
        />
      );
    }
    return (
      <div className={isRefreshingFiles ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isRefreshingFiles}>
        <DriveFileTable files={files} imports={imports} onImport={handleImport} />
        {files.length >= pageSize ? (
          <p className="text-xs text-gray-500 px-4 py-3 m-0 border-t border-gray-100">
            Showing the {pageSize} most recently modified files. Search to narrow the list, or show more.
          </p>
        ) : null}
      </div>
    );
  };

  const renderConnection = () => {
    if (statusQuery.isLoading) {
      return (
        <div aria-busy="true" aria-label="Checking the Google Drive connection" className="bg-white border border-gray-200 rounded-xl p-5">
          <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1 }} />
        </div>
      );
    }
    if (statusQuery.isError) {
      const unavailable = driveErrorKind(statusQuery.error) === "unavailable";
      return (
        <DriveStatePanel
          tone="error"
          icon={<FiAlertTriangle />}
          title={unavailable ? "The safety service isn't responding" : "Couldn't check the Google Drive connection"}
          description={
            unavailable
              ? "Safety Monitoring can't reach the detection service right now, so Google Drive can't be used. Try again in a moment."
              : getApiErrorMessage(statusQuery.error, "Something went wrong while checking the connection.")
          }
          actions={<RetryButton onClick={() => statusQuery.refetch()} loading={statusQuery.isFetching} />}
        />
      );
    }
    if (!connected) {
      return (
        <DriveStatePanel
          icon={<FiLink />}
          title="Connect Google Drive"
          description={
            <>
              Give Safety Monitoring read-only access to a Google account so it can list and import .txt files and Google
              Docs for analysis. No files are changed. The connection is shared: once connected, everyone who uses Safety
              Monitoring can browse and import from this Drive.
            </>
          }
          actions={connectButton}
        />
      );
    }
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 text-xl shrink-0" aria-hidden="true">
            <FiCheckCircle />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 m-0">Google Drive is connected</h2>
            <p className="text-sm text-gray-500 m-0">
              Read-only access to .txt files and Google Docs. This connection is shared by everyone who uses Safety Monitoring.
            </p>
          </div>
        </div>
        <Popconfirm
          title="Disconnect Google Drive?"
          description="Disconnecting affects everyone who uses Safety Monitoring. Imports and the auto-import watcher stop working until Drive is connected again."
          okText="Disconnect"
          okButtonProps={{ danger: true, loading: disconnectMutation.isPending }}
          cancelText="Keep connected"
          onConfirm={() => disconnectMutation.mutateAsync().catch(() => undefined)}
        >
          <Button danger loading={disconnectMutation.isPending}>
            Disconnect
          </Button>
        </Popconfirm>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SafetyTabs />

      <div>
        <h1 className="text-xl font-semibold text-gray-900 m-0">Google Drive import</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          Import .txt files and Google Docs straight from Drive and run them through the safety analysis. No upload needed.
        </p>
      </div>

      {notice ? (
        <Alert
          type={notice.type}
          showIcon
          closable
          message={notice.text}
          onClose={() => setNotice(null)}
        />
      ) : null}

      {renderConnection()}

      {connected ? (
        <>
          <DriveWatcherPanel />

          <section aria-labelledby="drive-files-heading" className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
              <h2 id="drive-files-heading" className="text-base font-semibold text-gray-900 m-0">
                Files
                {filesQuery.data ? (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {files.length} {files.length === 1 ? "file" : "files"}
                  </span>
                ) : null}
              </h2>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Input
                  allowClear
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by file name"
                  aria-label="Search Drive files by name"
                  prefix={<FiSearch aria-hidden="true" className="text-gray-400" />}
                  maxLength={200}
                  className="w-full sm:w-64"
                />
                <Select
                  value={pageSize}
                  onChange={setPageSize}
                  aria-label="Files to show"
                  options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `Show ${n}` }))}
                  className="w-28"
                />
                <Button
                  icon={<FiRefreshCw aria-hidden="true" />}
                  aria-label="Refresh file list"
                  loading={filesQuery.isFetching}
                  onClick={() => filesQuery.refetch()}
                />
              </div>
            </div>
            {renderFileList()}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default function GoogleDrivePage() {
  // useSearchParams needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={null}>
      <GoogleDriveContent />
    </Suspense>
  );
}
