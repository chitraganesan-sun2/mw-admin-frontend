"use client";

import React, { ReactNode, useId } from "react";
import { Button, Skeleton } from "antd";
import type { IconType } from "react-icons";

export type ChartTable = { columns: string[]; rows: Array<Array<string | number>> };

type ChartCardProps = {
  title: string;
  icon: IconType;
  iconColor?: string;
  /** Small note on the right of the title ("Last 14 days"). */
  note?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyText?: string;
  /** Text alternative for the chart; read by screen readers instead of the SVG. */
  summary?: string;
  /** The chart's data as a table for assistive tech (visually hidden). */
  table?: ChartTable;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/**
 * Frame shared by every analytics chart: title, loading / error (with retry) / empty states, and a
 * visually hidden data table so the numbers are available without the picture.
 */
export default function ChartCard({
  title,
  icon: Icon,
  iconColor = "#6366F1",
  note,
  isLoading,
  isError,
  errorText,
  onRetry,
  isEmpty,
  emptyText = "Not enough data yet.",
  summary,
  table,
  footer,
  className,
  children,
}: ChartCardProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={`relative flex min-w-0 flex-col rounded-2xl border border-stroke bg-white p-4 sm:p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${iconColor}1A` }}
          aria-hidden="true"
        >
          <Icon size={16} color={iconColor} />
        </span>
        <h3 id={headingId} className="m-0 text-base font-semibold text-dark">
          {title}
        </h3>
        {note ? <span className="ml-auto text-xs text-[#6B7280]">{note}</span> : null}
      </div>

      {isLoading ? (
        <Skeleton active title={false} paragraph={{ rows: 6 }} />
      ) : isError ? (
        <div role="alert" className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <p className="text-sm text-gray-medium m-0">{errorText ?? "Couldn't load this chart."}</p>
          {onRetry ? <Button onClick={onRetry}>Try again</Button> : null}
        </div>
      ) : isEmpty ? (
        <p className="text-sm text-gray-medium text-center py-10 m-0">{emptyText}</p>
      ) : (
        <>
          {summary ? <p className="sr-only">{summary}</p> : null}
          <div aria-hidden="true">{children}</div>
          {table ? (
            // The wrapper does the visually-hidden clipping: a `sr-only` class on the <table> itself leaves it
            // at its natural width, which stretched the whole page sideways (and, on phones, the layout viewport).
            <div className="sr-only">
              <table>
                <caption>{`${title} data`}</caption>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {footer}
        </>
      )}
    </section>
  );
}
