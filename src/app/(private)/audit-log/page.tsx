"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button, Input } from "antd";
import { FiRefreshCw } from "react-icons/fi";
import { useQueryState } from "nuqs";
import Table from "@/components/Table";
import { getAuditLog, type AuditEntry } from "@/api/audit";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDateTime } from "@/utils/displayDateTime";
import { describeAction, metadataLines, shortId } from "@/utils/auditLog";
import { GET_API } from "@/api/request";
import { endpoints } from "@/api/constants";

// Every privileged change made in this portal (deletes, approvals, bulk mail, exports...), newest
// first. Admin-only. Read-only: there is nothing to edit here.
export default function AuditLogPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const [page, setPage] = useQueryState("page", { defaultValue: "1" });
  const [size, setSize] = useQueryState("size", { defaultValue: "25" });
  const [action, setAction] = useQueryState("action");
  const [targetId, setTargetId] = useQueryState("target");

  // The filter boxes type locally and only update the URL (and so the query) on Enter / blur.
  const [actionDraft, setActionDraft] = useState(action ?? "");
  const [targetDraft, setTargetDraft] = useState(targetId ?? "");

  useEffect(() => {
    setHeaderOptions({ title: "Audit Log", titleIcon: getHeaderIcon(pathname) });
  }, [setHeaderOptions, pathname]);

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["audit-log", page, size, action, targetId],
    queryFn: () =>
      getAuditLog({
        page: Number(page),
        size: Number(size),
        action: action ?? undefined,
        target_id: targetId ?? undefined,
      }),
    placeholderData: (prev) => prev,
  });

  // Admin ids are opaque; the Accounts list (same permission as this page) turns them into names.
  const { data: accounts } = useQuery({
    queryKey: ["staff-accounts"],
    queryFn: async () => ((await GET_API(endpoints.accounts.list))?.data ?? []) as Array<{ user_id: string; username: string }>,
    staleTime: 5 * 60 * 1000,
  });
  const nameOf = (id: string) => accounts?.find((a) => a.user_id === id)?.username;

  const applyFilters = () => {
    setAction(actionDraft.trim() || null);
    setTargetId(targetDraft.trim() || null);
    setPage("1");
  };
  const clearFilters = () => {
    setActionDraft("");
    setTargetDraft("");
    setAction(null);
    setTargetId(null);
    setPage("1");
  };

  const columns = [
    {
      title: "When",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => formatDisplayDateTime(v),
    },
    {
      title: "What happened",
      dataIndex: "action",
      key: "action",
      render: (v: string) => (
        <span title={v}>
          <span className="!normal-case">{describeAction(v)}</span>
        </span>
      ),
    },
    {
      title: "Who",
      dataIndex: "admin_id",
      key: "admin_id",
      render: (v: string) => {
        const name = nameOf(v);
        return name ? (
          <span className="!normal-case" title={v}>
            {name}
          </span>
        ) : (
          <span className="font-mono text-xs !normal-case" title={v}>
            {shortId(v)}
          </span>
        );
      },
    },
    {
      title: "On",
      key: "target",
      render: (_: unknown, row: AuditEntry) =>
        row.target_id ? (
          <span className="!normal-case">
            {row.target_type ? `${row.target_type} ` : ""}
            <span className="font-mono text-xs" title={row.target_id}>
              {shortId(row.target_id)}
            </span>
          </span>
        ) : (
          "-"
        ),
    },
  ];

  const filtered = !!(action || targetId);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-gray-medium">
          Action
          <Input
            allowClear
            value={actionDraft}
            onChange={(e) => setActionDraft(e.target.value)}
            onPressEnter={applyFilters}
            onBlur={applyFilters}
            placeholder="e.g. learner.delete"
            aria-label="Filter by action"
            className="!w-56"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-medium">
          Target id
          <Input
            allowClear
            value={targetDraft}
            onChange={(e) => setTargetDraft(e.target.value)}
            onPressEnter={applyFilters}
            onBlur={applyFilters}
            placeholder="Full id of the person or item"
            aria-label="Filter by target id"
            className="!w-64"
          />
        </label>
        {filtered ? <Button onClick={clearFilters}>Clear filters</Button> : null}
        <Button icon={<FiRefreshCw aria-hidden />} onClick={() => refetch()} loading={isFetching} className="ml-auto">
          Refresh
        </Button>
      </div>

      {isError ? (
        <div role="alert" className="rounded-xl border border-stroke bg-white p-4 text-sm text-dark">
          {getApiErrorMessage(error, "Couldn't load the audit log.")}{" "}
          <Button size="small" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <Table
          data={data?.data ?? []}
          columns={columns}
          loading={isFetching}
          rowKey="audit_id"
          emptyText={filtered ? "No entries match these filters." : "Nothing has been recorded yet."}
          expandable={{
            rowExpandable: (row: AuditEntry) => metadataLines(row.metadata).length > 0,
            expandedRowRender: (row: AuditEntry) => (
              <ul className="m-0 list-none p-0 text-xs !normal-case text-gray-medium">
                {metadataLines(row.metadata).map((line) => (
                  <li key={line} className="font-mono break-all">
                    {line}
                  </li>
                ))}
              </ul>
            ),
          }}
          pagination={{
            current: Number(page),
            pageSize: Number(size),
            total: data?.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: ["25", "50", "100"],
          }}
          onChange={(p: any) => {
            setPage(String(p.current));
            setSize(String(p.pageSize));
          }}
        />
      )}
    </div>
  );
}
