"use client";

import { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import { WINGTIME_STATUS_LABEL, hasEnded, whenInHostZone, type AdminWingTime } from "@/utils/wingtime";

type Props = {
  item: AdminWingTime | null;
  approving: boolean;
  rejecting: boolean;
  completing: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onShowParticipants: () => void;
  onComplete: () => void;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-medium mb-1">{label}</p>
    <div className="text-sm text-gray-dark break-words whitespace-pre-line">{children}</div>
  </div>
);

export default function WingTimeReviewModal({
  item,
  approving,
  rejecting,
  completing,
  onClose,
  onApprove,
  onReject,
  onShowParticipants,
  onComplete,
}: Props) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // A reason typed for one session must never carry over to the next one opened.
  const id = item?.wingtime_id;
  useEffect(() => {
    setDeclining(false);
    setReason("");
    setError("");
  }, [id]);

  const pending = item?.status === "pending_approval";
  const busy = approving || rejecting || completing;

  const submitDecline = () => {
    if (!reason.trim()) {
      setError("Enter a reason - the host will see it.");
      return;
    }
    onReject(reason.trim());
  };

  const btn =
    "rounded-2xl px-5 py-3 text-sm font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed border";

  return (
    <CenterModal isOpen={!!item} onClose={() => !busy && onClose()} title={item ? item.topic : "WingTime"} width={680} hideFooter>
      {item && (
        <div className="flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Host">{item.host_name || "-"}</Row>
            <Row label="Status">{WINGTIME_STATUS_LABEL[item.status]}</Row>
            <Row label="When (host's time zone)">{whenInHostZone(item)}</Row>
            <Row label="Capacity">
              {item.registered_count} of {item.capacity} signed up
            </Row>
          </div>
          <Row label="Description">{item.description}</Row>
          <Row label="Materials">
            {!item.materials || item.materials.trim().toLowerCase() === "none" ? "No materials needed" : item.materials}
          </Row>
          {item.tags.length > 0 && <Row label="Topics">{item.tags.join(", ")}</Row>}
          {item.status === "rejected" && item.reject_reason && <Row label="Reason given">{item.reject_reason}</Row>}

          {!pending && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onShowParticipants}
                disabled={busy}
                className={`${btn} bg-white text-[#121212] border-[#E5E5E5]`}
              >
                Participants
              </button>
              {item.status === "approved" && hasEnded(item) && (
                <button type="button" onClick={onComplete} disabled={busy} className={`${btn} bg-black text-white border-black`}>
                  {completing ? "Saving..." : "Mark completed"}
                </button>
              )}
            </div>
          )}

          {pending && !declining && (
            <>
              <p className="text-xs text-gray-medium">
                Approving creates the Google Meet link and makes this visible to learners. The host is told either way.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy}
                  className={`${btn} bg-black text-white border-black`}
                >
                  {approving ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeclining(true)}
                  disabled={busy}
                  className={`${btn} bg-white text-[#121212] border-[#E5E5E5]`}
                >
                  Don&apos;t approve
                </button>
              </div>
            </>
          )}

          {pending && declining && (
            <div className="flex flex-col gap-2">
              <label htmlFor="wingtime-reject-reason" className="text-sm font-medium text-gray-dark">
                Why isn&apos;t this approved? (the host will see this)
              </label>
              <textarea
                id="wingtime-reject-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                maxLength={500}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "wingtime-reject-error" : undefined}
                className="w-full min-h-[90px] rounded-lg border border-gray-200 p-3 text-sm text-gray-dark focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {error && (
                <p id="wingtime-reject-error" role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submitDecline}
                  disabled={busy}
                  className={`${btn} bg-black text-white border-black`}
                >
                  {rejecting ? "Sending..." : "Send decision"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeclining(false)}
                  disabled={busy}
                  className={`${btn} bg-white text-[#121212] border-[#E5E5E5]`}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </CenterModal>
  );
}
