"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createInFlightGuard } from "@/utils/inflight";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Table from "@/components/Table";
import { Button } from "antd";
import FilterChips from "@/components/common/Filters/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import { FiVideo } from "react-icons/fi";
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
import WaitingBadge from "@/components/common/WaitingBadge";
import {
  RECORDING_STATUS_LABEL,
  WINGTIME_STATUS_LABEL,
  WINGTIME_TABS,
  whenInHostZone,
  type AdminWingTime,
  type AdminWingTimePage,
  type RosterParticipant,
  type WingTimeStatus,
} from "@/utils/wingtime";

const cell = "text-ink";

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
  const [cancelling, setCancelling] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);

  useEffect(() => {
    setHeaderOptions({ title: "WingTime", titleIcon: getHeaderIcon(pathname), showSearch: false });
  }, [pathname, setHeaderOptions]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
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

  const decideNow = async (kind: "approve" | "reject", reason?: string) => {
    if (!reviewing) return;
    const set = kind === "approve" ? setApproving : setRejecting;
    set(true);
    try {
      if (kind === "approve") {
        await POST_API(endpoints.wingtime.approve(reviewing.wingtime_id), {});
        showToast({ message: "WingTime approved. The meeting link was created and learners can now see it." });
      } else {
        await POST_API(endpoints.wingtime.reject(reviewing.wingtime_id), { reason });
        showToast({ message: "WingTime rejected. The volunteer has been told." });
      }
      setReviewing(null);
    } catch (error) {
      showToast({
        message: getApiErrorMessage(
          error,
          kind === "approve" ? "Couldn't approve the WingTime. Please try again." : "Couldn't reject the WingTime. Please try again."
        ),
        type: "error",
      });
    } finally {
      set(false);
      refresh();
    }
  };

  const cancelNow = async (reason: string) => {
    if (!reviewing) return;
    setCancelling(true);
    try {
      await POST_API(endpoints.wingtime.cancel(reviewing.wingtime_id), reason ? { reason } : {});
      showToast({ message: "WingTime cancelled. The host and everyone who signed up have been told." });
      setReviewing(null);
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't cancel the WingTime. Please try again."), type: "error" });
    } finally {
      setCancelling(false);
      refresh();
    }
  };

  const completeNow = async () => {
    if (!reviewing) return;
    setCompleting(true);
    try {
      await POST_API(endpoints.wingtime.complete(reviewing.wingtime_id), {});
      showToast({ message: "WingTime marked as completed" });
      setReviewing(null);
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't mark it completed. Please try again."), type: "error" });
    } finally {
      setCompleting(false);
      refresh();
    }
  };

  const decideRecordingNow = async (action: "publish" | "reject" | "unpublish", acknowledgeFlags = false) => {
    if (!reviewing) return;
    setRecordingBusy(true);
    try {
      const res: any = await POST_API(
        endpoints.wingtime.recording(reviewing.wingtime_id, action),
        action === "publish" ? { acknowledge_flags: acknowledgeFlags } : {}
      );
      const messages = {
        publish: "Recording published. It now appears in Resources.",
        reject: "Recording won't be published. It stays private in Google Drive.",
        unpublish: "Recording removed from Resources and its Drive link was turned off.",
      };
      showToast({ message: messages[action] });
      if (res?.data) setReviewing(res.data as AdminWingTime); // keep the dialog open on the new state
    } catch (error) {
      showToast({ message: getApiErrorMessage(error, "Couldn't update the recording. Please try again."), type: "error" });
    } finally {
      setRecordingBusy(false);
      refresh();
    }
  };

  // One review action at a time: a second click (before the first re-renders the disabled state)
  // would otherwise send the same approve/reject/complete/publish twice.
  const flight = useRef(createInFlightGuard());
  const decide = (kind: "approve" | "reject", reason?: string) => flight.current.run(() => decideNow(kind, reason));
  const complete = () => flight.current.run(completeNow);
  const cancelWingTime = (reason: string) => flight.current.run(() => cancelNow(reason));
  const decideRecording = (action: "publish" | "reject" | "unpublish", acknowledgeFlags = false) =>
    flight.current.run(() => decideRecordingNow(action, acknowledgeFlags));

  const columns = useMemo(
    () => [
      {
        title: "Topic",
        dataIndex: "topic",
        key: "topic",
        width: 210,
        render: (_: unknown, r: AdminWingTime) => <span className={`${cell} !font-semibold break-words`}>{r.topic}</span>,
      },
      {
        title: "Volunteer",
        dataIndex: "host_name",
        key: "host_name",
        width: 130,
        ellipsis: true,
        render: (_: unknown, r: AdminWingTime) => <span className={cell}>{r.host_name || "-"}</span>,
      },
      {
        title: "When (Volunteer's Time Zone)",
        key: "when",
        width: 240,
        render: (_: unknown, r: AdminWingTime) => <span className={cell}>{whenInHostZone(r)}</span>,
      },
      {
        title: "Registered",
        key: "capacity",
        width: 110,
        className: "whitespace-nowrap",
        render: (_: unknown, r: AdminWingTime) => (
          <span className={cell}>
            {r.registered_count} / {r.capacity}
          </span>
        ),
      },
      {
        title: "Status",
        key: "status",
        width: 160,
        className: "whitespace-nowrap",
        render: (_: unknown, r: AdminWingTime) => (
          <span className="flex flex-col items-start gap-1">
            <span className={cell}>{WINGTIME_STATUS_LABEL[r.status]}</span>
            {r.status === "pending_approval" ? <WaitingBadge since={r.created_at} /> : null}
          </span>
        ),
      },
      {
        title: "Recording",
        key: "recording",
        width: 150,
        render: (_: unknown, r: AdminWingTime) => (
          <span className={`${cell} ${r.recording_status === "pending_review" ? "!font-semibold" : ""}`}>
            {r.recording_status ? RECORDING_STATUS_LABEL[r.recording_status] : "-"}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        width: 170,
        fixed: "right" as const,
        align: "right" as const,
        render: (_: unknown, r: AdminWingTime) => (
          <Button
            size="small"
            type={r.status === "pending_approval" ? "primary" : "default"}
            onClick={(e) => {
              e.stopPropagation();
              setReviewing(r);
            }}
            aria-label={`${r.status === "pending_approval" ? "Review" : "View"} ${r.topic}`}
          >
            {r.status === "pending_approval" ? "Review WingTime" : "View WingTime"}
          </Button>
        ),
      },
    ],
    []
  );

  if (!WINGTIME_ENABLED) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-stroke bg-white">
          <EmptyState
            icon={<FiVideo />}
            title="WingTime isn't available yet"
            description="This feature isn't switched on for the admin portal yet, so there is nothing to review here."
          />
        </div>
      </div>
    );
  }

  const rows = data?.items ?? [];
  const reviewingIndex = reviewing ? rows.findIndex((r) => r.wingtime_id === reviewing.wingtime_id) : -1;
  const queue =
    reviewingIndex >= 0
      ? {
          position: reviewingIndex + 1,
          total: rows.length,
          onPrev: reviewingIndex > 0 ? () => setReviewing(rows[reviewingIndex - 1]) : undefined,
          onNext: reviewingIndex < rows.length - 1 ? () => setReviewing(rows[reviewingIndex + 1]) : undefined,
        }
      : undefined;

  return (
    <div className="w-full h-auto p-6 animate-fadeIn">
      <WingTimeReviewModal
        item={reviewing}
        approving={approving}
        rejecting={rejecting}
        completing={completing}
        cancelling={cancelling}
        recordingBusy={recordingBusy}
        onRecording={decideRecording}
        onClose={() => setReviewing(null)}
        onApprove={() => decide("approve")}
        onReject={(reason) => decide("reject", reason)}
        onShowParticipants={() => reviewing && setRosterId(reviewing.wingtime_id)}
        onComplete={complete}
        onCancelWingTime={cancelWingTime}
        queue={queue}
      />
      <WingTimeRosterModal
        isOpen={!!rosterId}
        isLoading={roster.isLoading}
        isError={roster.isError}
        wingtime={roster.data?.wingtime ?? null}
        participants={roster.data?.participants ?? []}
        onClose={() => setRosterId(null)}
      />
      <h2 className="sr-only">WingTime</h2>
      <FilterChips
        className="mb-4"
        ariaLabel="WingTime status"
        items={WINGTIME_TABS}
        value={status}
        onChange={(key) => {
          setStatus(key);
          setPage(1);
        }}
      />
      {isError ? (
        <ErrorMsg message="Couldn't load the WingTime list." onRetry={() => refetch()} retrying={isFetching} />
      ) : !isLoading && !isFetching && rows.length === 0 ? (
        <div className="rounded-2xl border border-stroke bg-white">
          <EmptyState icon={<FiVideo />} title={`No ${WINGTIME_STATUS_LABEL[status].toLowerCase()} WingTimes`} />
        </div>
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
