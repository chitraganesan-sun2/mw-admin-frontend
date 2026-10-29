"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/Table";
import ErrorMsg from "@/components/common/Messages/ErrorMsg";
import { showToast } from "@/components/common/Toast";
import WingTimeReviewModal from "@/components/wingtime/WingTimeReviewModal";
import WingTimeRosterModal from "@/components/wingtime/WingTimeRosterModal";
import { GET_API, POST_API } from "@/api/request";
import { endpoints } from "@/api/constants";
import { getHeaderIcon } from "@/layouts/helper";
import { useComponentStore } from "@/store/useComponenetStore";
import { getApiErrorMessage } from "@/utils/apiError";
import { WINGTIME_ENABLED } from "@/config/wingtime";
import {
  WINGTIME_STATUS_LABEL,
  WINGTIME_TABS,
  whenInHostZone,
  type AdminWingTime,
  type AdminWingTimePage,
  type RosterParticipant,
  type WingTimeStatus,
} from "@/utils/wingtime";

const cell = "text-base text-[#121212] !font-poppins !font-medium";
const linkBtn =
  "bg-transparent border-0 px-3 !py-3 text-[14px] !font-medium text-[#121212] underline !font-poppins cursor-pointer whitespace-nowrap disabled:opacity-60";

export default function WingTimePage() {
  const { setHeaderOptions } = useComponentStore();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<WingTimeStatus>("pending_approval");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewing, setReviewing] = useState<AdminWingTime | null>(null);
  const [rosterId, setRosterId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    setHeaderOptions({ title: "WingTime", titleIcon: getHeaderIcon(pathname), showSearch: false });
  }, [pathname, setHeaderOptions]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["wingtime", status, page, pageSize],
    staleTime: 0,
    enabled: WINGTIME_ENABLED,
    queryFn: async (): Promise<AdminWingTimePage> => {
      const res: any = await GET_API(endpoints.wingtime.list(status, page, pageSize));
      return res?.data ?? { items: [], total: 0, page, size: pageSize };
    },
  });

  // The roster is a privileged read (children's names) and is audit-logged server-side, so it is
  // fetched only when an admin actually opens it - never prefetched or cached for long.
  const roster = useQuery({
    queryKey: ["wingtime-roster", rosterId],
    enabled: WINGTIME_ENABLED && !!rosterId,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const res: any = await GET_API(endpoints.wingtime.roster(rosterId as string));
      return res.data as { wingtime: AdminWingTime; participants: RosterParticipant[] };
    },
  });

  // Deciding the last item on a page above 1 leaves that page out of range - step back.
  const rowCount = data?.items.length ?? 0;
  useEffect(() => {
    if (!isFetching && page > 1 && rowCount === 0) setPage((p) => p - 1);
  }, [isFetching, page, rowCount]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["wingtime"] });

  const decide = async (kind: "approve" | "reject", reason?: string) => {
    if (!reviewing) return;
    const set = kind === "approve" ? setApproving : setRejecting;
    set(true);
    try {
      if (kind === "approve") {
        await POST_API(endpoints.wingtime.approve(reviewing.wingtime_id), {});
        showToast({ message: "Approved. The meeting link was created and learners can now see it." });
      } else {
        await POST_API(endpoints.wingtime.reject(reviewing.wingtime_id), { reason });
        showToast({ message: "Not approved. The host has been told." });
      }
      setReviewing(null);
    } catch (error) {
      showToast({
        message: getApiErrorMessage(
          error,
          kind === "approve" ? "Couldn't approve this WingTime. Please try again." : "Couldn't send the decision. Please try again."
        ),
        type: "error",
      });
    } finally {
      set(false);
      refresh();
    }
  };

  const complete = async () => {
    if (!reviewing) return;
    setCompleting(true);
    try {
      await POST_API(endpoints.wingtime.complete(reviewing.wingtime_id), {});
      showToast({ message: "Marked as completed." });
      setReviewing(null);
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't mark it completed. Please try again."), type: "error" });
    } finally {
      setCompleting(false);
      refresh();
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Topic",
        dataIndex: "topic",
        key: "topic",
        className: "p-6 w-[200px]",
        render: (_: unknown, r: AdminWingTime) => <span className={`${cell} !font-semibold break-words`}>{r.topic}</span>,
      },
      {
        title: "Host",
        dataIndex: "host_name",
        key: "host_name",
        className: "p-6 w-[130px]",
        render: (_: unknown, r: AdminWingTime) => <span className={cell}>{r.host_name || "-"}</span>,
      },
      {
        title: "When (host's time zone)",
        key: "when",
        className: "p-6 w-[250px]",
        render: (_: unknown, r: AdminWingTime) => <span className={cell}>{whenInHostZone(r)}</span>,
      },
      {
        title: "Signed up",
        key: "capacity",
        className: "p-6 w-[100px] whitespace-nowrap",
        render: (_: unknown, r: AdminWingTime) => (
          <span className={cell}>
            {r.registered_count} / {r.capacity}
          </span>
        ),
      },
      {
        title: "Status",
        key: "status",
        className: "p-6 w-[150px] whitespace-nowrap",
        render: (_: unknown, r: AdminWingTime) => <span className={cell}>{WINGTIME_STATUS_LABEL[r.status]}</span>,
      },
      {
        title: "",
        key: "actions",
        className: "!p-0 !w-[110px]",
        render: (_: unknown, r: AdminWingTime) => (
          <button
            type="button"
            className={linkBtn}
            onClick={(e) => {
              e.stopPropagation();
              setReviewing(r);
            }}
            aria-label={`${r.status === "pending_approval" ? "Review" : "View"} ${r.topic}`}
          >
            {r.status === "pending_approval" ? "Review" : "View"}
          </button>
        ),
      },
    ],
    []
  );

  if (!WINGTIME_ENABLED) {
    return <p className="p-6 text-sm text-[#6B7280]">WingTime isn&apos;t available yet.</p>;
  }

  const rows = data?.items ?? [];

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <WingTimeReviewModal
        item={reviewing}
        approving={approving}
        rejecting={rejecting}
        completing={completing}
        onClose={() => setReviewing(null)}
        onApprove={() => decide("approve")}
        onReject={(reason) => decide("reject", reason)}
        onShowParticipants={() => reviewing && setRosterId(reviewing.wingtime_id)}
        onComplete={complete}
      />
      <WingTimeRosterModal
        isOpen={!!rosterId}
        isLoading={roster.isLoading}
        isError={roster.isError}
        wingtime={roster.data?.wingtime ?? null}
        participants={roster.data?.participants ?? []}
        onClose={() => setRosterId(null)}
      />
      <div className="w-full mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[20px] font-medium text-[#121212] !font-poppins">WingTime</h2>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="WingTime status">
          {WINGTIME_TABS.map((tab) => (
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
        <div className="w-full py-10 text-center text-[#6B7280]">No {WINGTIME_STATUS_LABEL[status].toLowerCase()} WingTimes</div>
      ) : (
        <Table
          key={`wingtime-${status}`}
          data={rows}
          columns={columns}
          rowKey="wingtime_id"
          loading={isLoading || isFetching}
          onRow={(record: AdminWingTime) => ({
            onClick: () => setReviewing(record),
            className: "cursor-pointer",
          })}
          pagination={{ current: page, pageSize, total: data?.total ?? 0, showSizeChanger: true }}
          onChange={(p: any) => {
            setPage(p.current ?? 1);
            setPageSize(p.pageSize ?? 10);
          }}
        />
      )}
    </div>
  );
}
