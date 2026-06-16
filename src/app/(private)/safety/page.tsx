"use client";

import React from "react";

/**
 * Safety Module Page
 * 
 * Embeds the detection pipeline's admin dashboard (admin-next) inside the
 * MW admin panel. The detection pipeline dashboard runs on its own port
 * and is displayed here via iframe.
 * 
 * In production, set NEXT_PUBLIC_SAFETY_DASHBOARD_URL to the deployed URL
 * of the detection pipeline's admin frontend.
 */

const SAFETY_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_SAFETY_DASHBOARD_URL || "http://localhost:5173";

export default function SafetyPage() {
  return (
    <div className="w-full h-full">
      <iframe
        src={`${SAFETY_DASHBOARD_URL}?embed=true`}
        className="w-full h-[90vh] border-0"
        title="Safety Detection Dashboard"
        allow="clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      />
    </div>
  );
}
