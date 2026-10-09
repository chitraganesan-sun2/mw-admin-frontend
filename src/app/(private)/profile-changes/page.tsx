"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/Table";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { showToast } from "@/components/common/Toast";
import ProfileChangeDetailsModal, { ProfileChangeDetails } from "@/components/profile-changes/ProfileChangeDetailsModal";
import { GET_API, PUT_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatDisplayDate } from "@/utils/moment";

type Row = {
  request_id: string;
  role: "learner" | "volunteer";
  name?: string | null;
  status: string;
  change_count: number;
  created_on?: string;
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const cell = "text-base text-[#121212] !font-poppins !font-medium";

export default function ProfileChangesPage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    setHeaderOptions({
      title: "Profile Changes",
      titleIcon: getHeaderIcon(pathname),
      showSearch: false,
    });
  }, [pathname, setHeaderOptions]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["profile-changes", status, page, pageSize],
    staleTime: 0,
    queryFn: async () => {
      const response: any = await GET_API(endpoints.profileChanges.list(status, page, pageSize));
      return { rows: (response?.data?.data ?? []) as Row[], total: (response?.data?.total ?? 0) as number };
    },
  });

  const details = useQuery({
    queryKey: ["profile-change", selectedId],
    queryFn: async () => {
      const response: any = await GET_API(endpoints.profileChanges.get(selectedId as string));
      return response.data as ProfileChangeDetails;
    },
    enabled: !!selectedId,
    staleTime: 0,
  });

  // Deciding the last request on a page above 1 leaves that page out of range - step back.
  const rowCount = data?.rows.length ?? 0;
  useEffect(() => {
    if (!isFetching && page > 1 && rowCount === 0) setPage((p) => p - 1);
  }, [isFetching, page, rowCount]);

  const closeModal = () => setSelectedId(null);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["profile-changes"] });
    queryClient.invalidateQueries({ queryKey: ["profile-change"] });
    // An approval edits the member's profile (name, country...), so their cached admin views are stale too.
    ["volunteers", "learners", "volunteer-details", "learner-details"].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    setAcceptLoading(true);
    try {
      await PUT_API(endpoints.profileChanges.approve(selectedId), {});
      showToast({ message: "Changes approved and applied to the profile." });
      closeModal();
      refresh();
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't approve the changes. Please try again."), type: "error" });
      refresh();
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedId) return;
    setRejectLoading(true);
    try {
      await PUT_API(endpoints.profileChanges.reject(selectedId, reason || undefined), {});
      showToast({ message: "Changes rejected. The profile was left as it was." });
      closeModal();
      refresh();
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't reject the changes. Please try again."), type: "error" });
      refresh();
    } finally {
      setRejectLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        className: "p-6 w-[220px]",
        render: (_: unknown, r: Row) => <span className={`${cell} !font-semibold`}>{r.name || "-"}</span>,
      },
      {
        title: "Role",
        dataIndex: "role",
        key: "role",
        className: "p-6 w-[140px]",
        render: (_: unknown, r: Row) => <span className={`${cell} capitalize`}>{r.role}</span>,
      },
      {
        title: "Fields changed",
        dataIndex: "change_count",
        key: "change_count",
        className: "p-6 w-[160px]",
        render: (_: unknown, r: Row) => <span className={cell}>{r.change_count}</span>,
      },
      {
        title: "Submitted",
        dataIndex: "created_on",
        key: "created_on",
        className: "p-6 w-[200px] whitespace-nowrap",
        render: (_: unknown, r: Row) => <span className={cell}>{formatDisplayDate(r.created_on)}</span>,
      },
      {
        title: "",
        key: "actions",
        width: 160,
        className: "!p-0 !w-[160px]",
        render: (_: unknown, r: Row) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(r.request_id);
            }}
            className="bg-transparent border-0 px-6 !py-3 text-[14px] !font-medium text-[#121212] underline !font-poppins cursor-pointer whitespace-nowrap"
          >
            {status === "pending" ? "Review changes" : "View changes"}
          </button>
        ),
      },
    ],
    [status]
  );

  const rows = data?.rows ?? [];

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <ProfileChangeDetailsModal
        isOpen={!!selectedId}
        isLoading={details.isLoading}
        isError={details.isError}
        data={details.data ?? null}
        acceptLoading={acceptLoading}
        rejectLoading={rejectLoading}
        onClose={closeModal}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <div className="w-full mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-medium text-[#121212] !font-poppins">Profile Changes</h2>
        <div className="flex gap-2" role="tablist" aria-label="Request status">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={status === tab.key}
              onClick={() => {
                setStatus(tab.key);
                setPage(1);
              }}
              className={`rounded-3xl border px-4 py-2 text-sm !font-poppins cursor-pointer ${
                status === tab.key ? "bg-black text-white border-black" : "bg-white text-[#121212] border-[#E5E5E5]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {isError ? (
        <ErrorMsg />
      ) : !isLoading && !isFetching && rows.length === 0 ? (
        <div className="w-full py-10 text-center text-[#6B7280]">No {status} requests</div>
      ) : (
        <Table
          key={`profile-changes-${status}`}
          data={rows}
          columns={columns}
          rowKey="request_id"
          loading={isLoading || isFetching}
          onRow={(record: Row) => ({
            onClick: () => setSelectedId(record.request_id),
            className: "cursor-pointer",
          })}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            showSizeChanger: true,
          }}
          onChange={(p: any) => {
            setPage(p.current ?? 1);
            setPageSize(p.pageSize ?? 10);
          }}
        />
      )}
    </div>
  );
}
