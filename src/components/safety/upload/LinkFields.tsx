"use client";

import React from "react";
import { Collapse, Input } from "antd";
import { LINK_MAX_CHARS } from "./uploadRules";

const FIELDS: Array<{ key: keyof SafetyAnalysisLinks; label: string; placeholder: string }> = [
  { key: "session_id", label: "Session ID", placeholder: "Session this recording is from" },
  { key: "volunteer_id", label: "Volunteer ID", placeholder: "Volunteer in the session" },
  { key: "learner_id", label: "Learner ID", placeholder: "Learner in the session" },
];

interface LinkFieldsProps {
  value: SafetyAnalysisLinks;
  onChange: (next: SafetyAnalysisLinks) => void;
}

/** Optional ties between an analysis and MelodyWings records. Collapsed by default. */
export default function LinkFields({ value, onChange }: LinkFieldsProps) {
  return (
    <Collapse
      ghost
      className="border border-gray-200 rounded-xl bg-white"
      items={[
        {
          key: "links",
          label: <span className="font-medium">Link to a MelodyWings session (optional)</span>,
          children: (
            <div>
              <p className="text-sm text-gray-500 mt-0 mb-3">
                Fill in any of these to tie the analysis to a session. It applies to the files you start next, and the
                IDs show up on the report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {FIELDS.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`safety-link-${field.key}`} className="block text-sm font-medium mb-1">
                      {field.label}
                    </label>
                    <Input
                      id={`safety-link-${field.key}`}
                      value={value[field.key] ?? ""}
                      maxLength={LINK_MAX_CHARS}
                      placeholder={field.placeholder}
                      onChange={(e) => onChange({ ...value, [field.key]: e.target.value })}
                      onBlur={(e) => onChange({ ...value, [field.key]: e.target.value.trim() })}
                      allowClear
                    />
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
