import React from "react";
import { Button } from "antd";

interface DriveStatePanelProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  tone?: "neutral" | "error";
  actions?: React.ReactNode;
}

// One look for every "nothing to show here yet" state (not connected, service down, failed, empty).
export default function DriveStatePanel({ icon, title, description, tone = "neutral", actions }: DriveStatePanelProps) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className="flex flex-col items-center text-center gap-3 px-4 py-10 bg-white border border-gray-200 rounded-xl"
    >
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-full text-2xl ${
          tone === "error" ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-base font-semibold text-gray-900 m-0">{title}</h2>
      <p className="text-sm text-gray-500 max-w-xl m-0">{description}</p>
      {actions ? <div className="flex flex-wrap justify-center gap-2 mt-1">{actions}</div> : null}
    </div>
  );
}

export const RetryButton = ({ onClick, loading }: { onClick: () => void; loading?: boolean }) => (
  <Button onClick={onClick} loading={loading}>
    Try again
  </Button>
);
