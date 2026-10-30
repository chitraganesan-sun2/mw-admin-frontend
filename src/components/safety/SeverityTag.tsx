import { Tag } from "antd";
import { SEVERITY_COLORS, STATUS_LABELS, isSafetySeverity } from "./severity";

export const SeverityTag = ({ severity }: { severity?: string | null }) => {
  if (!isSafetySeverity(severity)) return <span className="text-gray-400">-</span>;
  return <Tag color={SEVERITY_COLORS[severity].tag}>{severity}</Tag>;
};

export const StatusTag = ({ status }: { status?: string | null }) => {
  const key = String(status ?? "").toUpperCase();
  const known = STATUS_LABELS[key];
  return <Tag color={known?.tag ?? "default"}>{known?.label ?? (status || "Unknown")}</Tag>;
};
