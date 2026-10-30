"use client";

import { useMemo } from "react";
import { Button } from "antd";
import { FiCode, FiCopy } from "react-icons/fi";
import { showToast } from "@/components/common/Toast";
import { Panel } from "./parts";

export default function RawDataTab({ report }: { report: SafetyReport }) {
  const json = useMemo(() => JSON.stringify(report, null, 2), [report]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      showToast({ type: "success", message: "Report JSON copied." });
    } catch {
      showToast({ type: "error", message: "Couldn't copy to the clipboard. Select the text and copy it manually." });
    }
  };

  return (
    <Panel
      title="Full report JSON"
      icon={<FiCode className="text-indigo-500" aria-hidden="true" />}
      extra={
        <Button icon={<FiCopy aria-hidden="true" />} onClick={copy}>
          Copy JSON
        </Button>
      }
    >
      <pre
        tabIndex={0}
        aria-label="Report JSON"
        className="text-xs leading-relaxed bg-gray-50 rounded-md p-3 overflow-auto max-h-[600px] whitespace-pre-wrap break-words"
      >
        {json}
      </pre>
    </Panel>
  );
}
