"use client";

import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button, DatePicker, Input, Select, Tag } from "antd";
import type { Dayjs } from "dayjs";
import { listDashboardSessions } from "@/api/dashboard";
import Table from "@/components/Table";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { safeHref } from "@/utils/safeHref";

const PAGE_SIZES = [10, 20, 50];
const SEARCH_DELAY_MS = 400;
const DATE_FORMAT = "YYYY-MM-DD";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Confirmed" },
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
const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "gold" },
  accepted: { label: "Confirmed", color: "green" },
  completed: { label: "Completed", color: "blue" },
  cancelled: { label: "Cancelled", color: "default" },
  rejected: { label: "Declined", color: "red" },
};

const personCell = (name: string | null) => name || <span className="text-[#4F4F4F]">Unknown</span>;

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

  const columns = [
    {
      title: "Session",
      dataIndex: "title",
      key: "title",
      render: (title: string | null) => title || "Untitled",
    },
    {
      title: "Starts",
      dataIndex: "start_utc",
      key: "start_utc",
      render: (start: string | null) => (start ? formatDisplayDateTime(start) : "Unknown"),
    },
    {
      title: "Volunteer",
      dataIndex: "volunteer_name",
      key: "volunteer_name",
      render: personCell,
    },
    {
      title: "Learner",
      dataIndex: "learner_name",
      key: "learner_name",
      render: personCell,
    },
    {
      title: "Type",
      dataIndex: "kind",
      key: "kind",
      render: (value: string) => (value === "instant" ? "Instant" : "Scheduled"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value: string) => {
        const known = STATUS_LABEL[value];
        return <Tag color={known?.color ?? "default"}>{known?.label ?? value}</Tag>;
      },
    },
    {
      title: "Join",
      dataIndex: "join_url",
      key: "join_url",
      render: (url: string | null, row: DashboardSession) => {
        const href = safeHref(url);
        return href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Join session ${row.title ?? row.session_id} (opens in a new tab)`}
            className="inline-block rounded-full bg-primary px-4 py-1 text-sm font-medium text-dark hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark"
          >
            Join
          </a>
        ) : (
          <span className="text-[#4F4F4F]" title="Only confirmed sessions that haven't ended have a link">
            —
          </span>
        );
      },
    },
  ];

  const rows = data?.sessions ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Input
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search name, title or ID"
          aria-label="Search sessions by volunteer or learner name, title or ID"
          style={{ width: 260 }}
        />
        <Select
          allowClear
          value={status}
          onChange={onFilter(setStatus)}
          options={STATUS_OPTIONS}
          placeholder="Status"
          aria-label="Filter by status"
          style={{ width: 140 }}
        />
        <Select
          allowClear
          value={kind}
          onChange={onFilter(setKind)}
          options={KIND_OPTIONS}
          placeholder="Type"
          aria-label="Filter by session type"
          style={{ width: 130 }}
        />
        <Select
          allowClear
          value={when}
          onChange={onFilter(setWhen)}
          options={WHEN_OPTIONS}
          placeholder="Upcoming / past"
          aria-label="Filter by upcoming or past"
          style={{ width: 150 }}
        />
        <DatePicker.RangePicker
          value={range}
          onChange={(value) => {
            setRange(value);
            setPage(1);
          }}
          aria-label="Filter by session date (UTC)"
        />
        {anyFilter ? <Button onClick={resetFilters}>Clear filters</Button> : null}
      </div>
      <p className="mb-3 text-xs text-[#4F4F4F]">Date filter uses UTC dates. Times in the table are shown in your time zone.</p>

      {error ? (
        <div role="alert" className="py-6">
          <p className="mb-3 text-dark">{getApiErrorMessage(error, "Couldn't load the sessions.")}</p>
          <Button onClick={() => refetch()} loading={isFetching}>
            Try again
          </Button>
        </div>
      ) : !isLoading && rows.length === 0 ? (
        <div className="w-full py-10 text-center text-[#4F4F4F]">
          {anyFilter ? "No sessions match these filters." : "No sessions yet."}
        </div>
      ) : (
        <Table
          data={rows}
          columns={columns}
          loading={isLoading || isFetching}
          rowKey="session_id"
          rootClassName="[&_.ant-table]:!normal-case [&_thead_th]:!bg-[#FAFAFA] [&_thead_th]:font-medium [&_tbody_td]:font-normal"
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: PAGE_SIZES,
          }}
          onChange={(pagination: { current?: number; pageSize?: number }) => {
            setPage(pagination.current ?? 1);
            setPageSize(pagination.pageSize ?? 20);
          }}
        />
      )}
    </div>
  );
}
