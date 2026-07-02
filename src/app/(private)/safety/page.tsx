"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useComponentStore } from "@/store/useComponenetStore";
import { usePathname } from "next/navigation";
import { getHeaderIcon } from "@/layouts/helper";

/**
 * Safety Module Page
 *
 * Embeds the detection pipeline's admin dashboard (admin-next) inside the
 * MW admin panel. The detection pipeline dashboard runs on its own port
 * and is displayed here via iframe.
 *
 * In production, set NEXT_PUBLIC_SAFETY_DASHBOARD_URL to the deployed URL
 * of the detection pipeline's admin frontend.
 *
 * Security notes:
 * - `allow-same-origin` is required because the embedded dashboard uses
 *   localStorage for auth tokens. This is safe because the dashboard runs
 *   on a DIFFERENT origin than the admin panel — it can only access its own
 *   storage, not the parent's cookies/storage.
 * - CSP frame-src header in next.config.js restricts which origins can be framed.
 */

const SAFETY_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SAFETY_DASHBOARD_URL || "";

export default function SafetyPage() {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();

  useEffect(() => {
    setHeaderOptions({
      title: "Safety Monitoring",
      titleIcon: getHeaderIcon(pathname),
    });
  }, [setHeaderOptions, pathname]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    // Force iframe reload by resetting src
    if (iframeRef.current) {
      iframeRef.current.src = `${SAFETY_DASHBOARD_URL}?embed=true&t=${Date.now()}`;
    }
  }, []);

  if (!SAFETY_DASHBOARD_URL) {
    return (
      <div className="flex flex-col items-center justify-center h-[90vh] text-gray-500 gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01M12 2l9 4.5v5c0 5.25-3.75 9.75-9 11-5.25-1.25-9-5.75-9-11v-5L12 2z"
          />
        </svg>
        <p className="text-lg font-medium">Safety Dashboard Unavailable</p>
        <p className="text-sm">
          The <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SAFETY_DASHBOARD_URL</code> environment variable is not configured.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center h-[90vh] bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading Safety Dashboard...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div className="flex flex-col items-center justify-center h-[90vh] text-red-500 gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium">Failed to Load Dashboard</p>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Could not connect to the safety dashboard. This may be caused by a
            network issue, incorrect URL, or the dashboard service being
            unavailable.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Target: <code className="bg-gray-100 px-1 rounded text-gray-600">{SAFETY_DASHBOARD_URL}</code>
          </p>
          <button
            onClick={handleRetry}
            className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={`${SAFETY_DASHBOARD_URL}?embed=true`}
        className={`w-full h-[90vh] border-0 ${hasError ? "hidden" : ""}`}
        title="Safety Detection Dashboard"
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
