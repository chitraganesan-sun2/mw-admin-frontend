"use client";

import { useId } from "react";
import { Button, Input, Select } from "antd";
import { SEVERITY_ORDER, categoryLabel } from "../severity";
import { DEFAULT_FILTERS, FindingFilters as Filters, FlagFilter, SortKey } from "./helpers";

interface Props {
  value: Filters;
  onChange: (next: Filters) => void;
  categories: string[];
  total: number;
  shown: number;
  noun: string; // "findings" | "evidence items"
}

const FLAG_OPTIONS: { value: FlagFilter; label: string }[] = [
  { value: "all", label: "Any" },
  { value: "high_conf", label: "High confidence (75%+)" },
  { value: "joke", label: "Flagged as joke" },
  { value: "negation", label: "Flagged as negation" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "original", label: "Report order" },
  { value: "confidence", label: "Confidence, high to low" },
  { value: "severity", label: "Severity, high to low" },
  { value: "time", label: "Time in conversation" },
];

export default function FindingFilters({ value, onChange, categories, total, shown, noun }: Props) {
  const uid = useId();
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const isDefault = JSON.stringify(value) === JSON.stringify(DEFAULT_FILTERS);
  const field = "flex flex-col gap-1 min-w-[160px] flex-1";
  const label = "text-xs font-medium text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className={`${field} min-w-[220px]`}>
          <label htmlFor={`${uid}-search`} className={label}>
            Search text
          </label>
          <Input
            id={`${uid}-search`}
            allowClear
            placeholder="Quote, matched text or speaker"
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </div>
        <div className={field}>
          <label htmlFor={`${uid}-category`} className={label}>
            Category
          </label>
          <Select
            id={`${uid}-category`}
            value={value.category}
            onChange={(category) => set({ category })}
            options={[
              { value: "all", label: "All categories" },
              ...categories.map((c) => ({ value: c, label: categoryLabel(c) })),
            ]}
          />
        </div>
        <div className={field}>
          <label htmlFor={`${uid}-severity`} className={label}>
            Severity
          </label>
          <Select
            id={`${uid}-severity`}
            value={value.severity}
            onChange={(severity) => set({ severity })}
            options={[
              { value: "all", label: "All severities" },
              ...[...SEVERITY_ORDER].reverse().map((s) => ({ value: s, label: s })),
            ]}
          />
        </div>
        <div className={field}>
          <label htmlFor={`${uid}-flag`} className={label}>
            Confidence and flags
          </label>
          <Select id={`${uid}-flag`} value={value.flag} onChange={(flag) => set({ flag })} options={FLAG_OPTIONS} />
        </div>
        <div className={field}>
          <label htmlFor={`${uid}-sort`} className={label}>
            Sort by
          </label>
          <Select id={`${uid}-sort`} value={value.sort} onChange={(sort) => set({ sort })} options={SORT_OPTIONS} />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-sm text-gray-600" aria-live="polite">
        <span>
          Showing {shown} of {total} {noun}
        </span>
        {!isDefault && (
          <Button type="link" size="small" onClick={() => onChange(DEFAULT_FILTERS)}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
