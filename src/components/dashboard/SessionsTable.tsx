"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button, DatePicker, Input, Select } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import StatusTag from "@/components/common/StatusTag";
import EmptyState from "@/components/common/EmptyState";
import { listDashboardSessions } from "@/api/dashboard";
import Table from "@/components/Table";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { safeHref } from "@/utils/safeHref";
import { JOIN_GRACE_MINUTES, sessionStatusDisplay } from "@/utils/sessionStatus";

const PAGE_SIZES = [10, 20, 50];
const SEARCH_DELAY_MS = 400;
const DATE_FORMAT = "YYYY-MM-DD";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Declined" },
];
const KIND_OPTIONS = [
  { value: "regular", label: "Scheduled" },
  { value: "instant", label: "Instant" },
];
const WHEN_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const personCell = (name: string | null) => name || <span className="text-ink-2">Unknown</span>;

// Built per render so "Today" is still today after the tab has been open overnight.
const rangePresets = (): { label: string; value: [Dayjs, Dayjs] }[] => [
  { label: "Today", value: [dayjs().startOf("day"), dayjs().endOf("day")] },
  { label: "Last 7 days", value: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")] },
  { label: "Last 30 days", value: [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")] },
];

export default function SessionsTable() {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>();
  const [kind, setKind] = useState<string>();
  const [when, setWhen] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Wait for a pause in typing before asking the server, and start again from page 1 whenever a
  // filter changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const dateFrom = range?.[0]?.format(DATE_FORMAT);
  const dateTo = range?.[1]?.format(DATE_FORMAT);
  const filters: DashboardSessionFilters = {
    status, kind, when, date_from: dateFrom, date_to: dateTo, search: search || undefined,
    // Upcoming sessions read best soonest-first; everything else newest-first.
    order: when === "upcoming" ? "asc" : "desc",
    page, size: pageSize,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["dashboard-sessions", filters],
    queryFn: () => listDashboardSessions(filters),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const anyFilter = Boolean(status || kind || when || dateFrom || dateTo || searchText);
  const resetFilters = () => {
    setSearchText("");
    setSearch("");
    setStatus(undefined);
    setKind(undefined);
    setWhen(undefined);
    setRange(null);
    setPage(1);
  };
  const onFilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  // "Type" only earns a column when the rows on screen are not all the same kind.
  const kindsOnPage = new Set((data?.sessions ?? []).map((r) => r.kind));
  const showKind = kindsOnPage.size > 1;

  const columns = [
    {
      title: "Session",
      dataIndex: "title",
      key: "title",
      width: 230,
      ellipsis: true,
      render: (title: string | null) => title || "Untitled",
    },
    {
      title: "Starts",
      dataIndex: "start_utc",
      key: "start_utc",
      width: 180,
      className: "whitespace-nowrap",
      render: (start: string | null) => (start ? formatDisplayDateTime(start) : "Unknown"),
    },
    {
      title: "Volunteer",
      dataIndex: "volunteer_name",
      key: "volunteer_name",
      width: 150,
      ellipsis: true,
      render: personCell,
    },
    {
      title: "Learner",
      dataIndex: "learner_name",
      key: "learner_name",
      width: 150,
      ellipsis: true,
      render: personCell,
    },
    ...(showKind
      ? [
          {
            title: "Type",
            dataIndex: "kind",
            key: "kind",
            width: 110,
            render: (value: string) => (value === "instant" ? "Instant" : "Scheduled"),
          },
        ]
      : []),
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (_value: string, row: DashboardSession) => {
        const shown = sessionStatusDisplay(row);
        return (
          <StatusTag dot color={shown.color}>
            {shown.label}
          </StatusTag>
        );
      },
    },
    {
      title: "Join",
      dataIndex: "join_url",
      key: "join_url",
      // Stays in view when the other columns have to scroll sideways on a narrow screen.
      fixed: "right" as const,
      width: 90,
      render: (url: string | null, row: DashboardSession) => {
        const href = safeHref(url);
        return href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Join session ${row.title ?? row.session_id} (opens in a new tab)`}
            className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-sm font-medium text-ink hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark"
          >
            Join
          </a>
        ) : (
          <span className="text-ink-2" title={`Only accepted sessions that haven't ended have a link (admins keep it ${JOIN_GRACE_MINUTES} minutes after the end)`}>
            —
          </span>
        );
      },
    },
  ];

  const rows = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-2 sm:flex sm:flex-wrap sm:items-center">
        <Input
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search name, title or ID"
          aria-label="Search sessions by volunteer or learner name, title or ID"
          className="col-span-2 sm:!w-[260px]"
        />
        <Select
          allowClear
          value={status}
          onChange={onFilter(setStatus)}
          options={STATUS_OPTIONS}
          placeholder="Status"
          aria-label="Filter by status"
          className="w-full sm:!w-[140px]"
        />
        <Select
          allowClear
          value={kind}
          onChange={onFilter(setKind)}
          options={KIND_OPTIONS}
          placeholder="Type"
          aria-label="Filter by session type"
          className="w-full sm:!w-[130px]"
        />
        <Select
          allowClear
          value={when}
          onChange={onFilter(setWhen)}
          options={WHEN_OPTIONS}
          placeholder="Upcoming / past"
          aria-label="Filter by upcoming or past"
          className="col-span-2 w-full sm:!w-[150px]"
        />
        <DatePicker.RangePicker
          value={range}
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
          presets={rangePresets()}
          aria-label="Filter by session date (UTC)"
          className="col-span-2 w-full sm:!w-auto"
        />
        {anyFilter ? (
          <Button onClick={resetFilters} className="col-span-2 sm:!col-auto">
            Clear filters
          </Button>
        ) : null}
      </div>
      <p className="mb-4 text-xs text-ink-2">Date filter uses UTC dates. Times are shown in your time zone.</p>

      {error ? (
        <div role="alert" className="py-6">
          <p className="mb-3 text-dark">{getApiErrorMessage(error, "Couldn't load the sessions.")}</p>
          <Button onClick={() => refetch()} loading={isFetching}>
            Try again
          </Button>
        </div>
      ) : !isLoading && rows.length === 0 ? (
        <div className="rounded-2xl border border-stroke bg-white">
          <EmptyState
            title={anyFilter ? "No sessions match these filters" : "No sessions yet"}
            description={anyFilter ? "Try a wider date range or clear a filter." : undefined}
            action={anyFilter ? <Button onClick={resetFilters}>Clear filters</Button> : undefined}
          />
        </div>
      ) : (
        <>
          {/* Phones: one card per session (a seven-column table is unreadable at this width). */}
          <div className="md:hidden" aria-busy={isLoading || isFetching}>
            <ul className="space-y-3" aria-label="Sessions">
              {rows.map((row) => {
                const href = safeHref(row.join_url);
                const shown = sessionStatusDisplay(row);
                return (
                  <li key={row.session_id} className="rounded-2xl border border-stroke bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-medium text-dark">{row.title || "Untitled"}</h3>
                      <StatusTag dot color={shown.color} className="shrink-0">
                        {shown.label}
                      </StatusTag>
                    </div>
                    <p className="mt-1 text-sm text-ink-2">
                      {row.start_utc ? formatDisplayDateTime(row.start_utc) : "Unknown time"} ·{" "}
                      {row.kind === "instant" ? "Instant" : "Scheduled"}
                    </p>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <dt className="text-ink-2">Volunteer</dt>
                      <dd className="min-w-0 break-words text-dark">{row.volunteer_name || "Unknown"}</dd>
                      <dt className="text-ink-2">Learner</dt>
                      <dd className="min-w-0 break-words text-dark">{row.learner_name || "Unknown"}</dd>
                    </dl>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Join session ${row.title ?? row.session_id} (opens in a new tab)`}
                        className="mt-4 flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-dark hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark"
                      >
                        Join
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button size="large" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-center text-sm text-ink-2" aria-live="polite">
                Page {page} of {totalPages}
                <br />
                {total} sessions
              </span>
              <Button size="large" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>

          {/* Tablets and desktops: the table. */}
          <div className="hidden md:block">
            <Table
              data={rows}
              columns={columns}
              loading={isLoading || isFetching}
              rowKey="session_id"
              rootClassName="[&_.ant-table]:!normal-case"
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZES,
              }}
              onChange={(pagination: { current?: number; pageSize?: number }) => {
                setPage(pagination.current ?? 1);
                setPageSize(pagination.pageSize ?? 20);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
