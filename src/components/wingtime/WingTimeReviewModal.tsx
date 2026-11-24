"use client";

import { useEffect, useState } from "react";
import CenterModal from "@/components/common/Modals/CenterModal";
import RecordingPreview from "@/components/wingtime/RecordingPreview";
import {
  RECORDING_STATUS_LABEL,
  WINGTIME_STATUS_LABEL,
  safetyState,
  publishBlocked,
  hasEnded,
  whenInHostZone,
  type AdminWingTime,
} from "@/utils/wingtime";

type Props = {
  item: AdminWingTime | null;
  approving: boolean;
  rejecting: boolean;
  completing: boolean;
  recordingBusy: boolean;
  onRecording: (action: "publish" | "reject" | "unpublish", acknowledgeFlags?: boolean) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onShowParticipants: () => void;
  onComplete: () => void;
  queue?: CenterModalProps["queue"];
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-gray-medium mb-1">{label}</p>
    <div className="text-sm text-gray-dark break-words whitespace-pre-line">{children}</div>
  </div>
);

const actionBtn = "h-9 px-4 rounded-xl text-sm cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed";

/**
 * Review dialog - the same pattern as the Profile Changes dialog: details in the body, a
 * "Rejection reason" box, and the shared Reject / Accept footer. (Here the reason is required,
 * because the host sees it.) Once decided, the footer goes away and the body offers Participants
 * and, after the session has ended, Mark Completed.
 */
export default function WingTimeReviewModal({
  item,
  approving,
  rejecting,
  completing,
  recordingBusy,
  onRecording,
  onClose,
  onApprove,
  onReject,
  onShowParticipants,
  onComplete,
  queue,
}: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [reviewedFlags, setReviewedFlags] = useState(false);

  // A reason typed for one WingTime must never carry over to the next one opened.
  const id = item?.wingtime_id;
  useEffect(() => {
    setReason("");
    setError("");
    setReviewedFlags(false);
  }, [id]);

  const pending = item?.status === "pending_approval";
  const busy = approving || rejecting || completing || recordingBusy;
  const recording = item?.recording_status ?? null;
  const safety = item ? safetyState(item) : null;
  // Publishing needs a completed safety analysis, and a flagged session needs the admin's explicit OK.
  const publishBlockedNow = publishBlocked(safety, reviewedFlags);

  const handleReject = () => {
    if (!reason.trim()) {
      setError("Please enter a rejection reason - the volunteer will see it.");
      return;
    }
    onReject(reason.trim());
  };

  return (
    <CenterModal
      isOpen={!!item}
      onClose={() => !busy && onClose()}
      title={item ? item.topic : "WingTime"}
      queue={queue}
      width={720}
      hideFooter={!pending}
      actionLoading={busy}
      acceptLoading={approving}
      rejectLoading={rejecting}
      onAccept={onApprove}
      onReject={handleReject}
    >
      {item && (
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="Volunteer">{item.host_name || "-"}</Row>
            <Row label="Status">{WINGTIME_STATUS_LABEL[item.status]}</Row>
            <Row label="When (volunteer's time zone)">{whenInHostZone(item)}</Row>
            <Row label="Capacity">
              {item.registered_count} of {item.capacity} signed up
            </Row>
          </div>
          <Row label="Description">{item.description}</Row>
          <Row label="Materials">
            {!item.materials || item.materials.trim().toLowerCase() === "none" ? "None needed" : item.materials}
          </Row>
          {item.tags.length > 0 && <Row label="Topics">{item.tags.join(", ")}</Row>}

          {pending ? (
            <div>
              <p className="text-sm font-medium text-gray-medium mb-2">Rejection reason (required to reject)</p>
              <textarea
                aria-label="Rejection reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim()) setError("");
                }}
                maxLength={500}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "wingtime-reject-error" : undefined}
                placeholder="Tell the volunteer why this WingTime wasn't approved. It's shown to them on the WingTime."
                className="w-full min-h-[80px] rounded-lg border border-gray-200 p-3 text-sm text-gray-dark focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              {error && (
                <p id="wingtime-reject-error" role="alert" className="mt-1 text-sm text-error">
                  {error}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-medium">
                Accepting creates the Google Meet link and makes this visible to learners. The volunteer is told either way.
              </p>
            </div>
          ) : (
            <>
              {item.status === "rejected" && item.reject_reason && (
                <p className="text-sm text-gray-dark">
                  <span className="font-medium">Rejection reason:</span> {item.reject_reason}
                </p>
              )}
              {recording && (
                <div className="rounded-xl border border-[#E5E5E5] p-4 flex flex-col gap-3">
                  <p className="text-sm font-medium text-gray-dark">Recording: {RECORDING_STATUS_LABEL[recording]}</p>
                  {recording === "pending_review" && (
                    <p className="text-xs text-gray-medium">
                      Children may appear in this recording, so watch it first. It stays private in Google Drive (open it
                      from the account that organizes WingTimes). Publishing shares it by link and adds it to Resources.
                    </p>
                  )}
                  {safety && (recording === "pending_review" || recording === "unpublished") && (
                    <div className="text-sm text-gray-dark" aria-live="polite">
                      {safety.kind === "waiting" && <p>Safety analysis: still running. Publishing unlocks when it finishes.</p>}
                      {safety.kind === "failed" && (
                        <p className="text-error font-medium">
                          Safety analysis: it ended with an error, so this recording can&apos;t be published. Open the{" "}
                          <a href={`/safety/report/${safety.reportId}`} target="_blank" rel="noopener noreferrer" className="underline">
                            safety report
                          </a>{" "}
                          to see why, or reject the recording.
                        </p>
                      )}
                      {safety.kind === "none" && (
                        <p className="text-error font-medium">
                          Safety analysis: this session has no transcript to check (nobody spoke, or it was unavailable), so
                          the recording can&apos;t be published. You can reject it.
                        </p>
                      )}
                      {safety.kind === "done" && (
                        <p className={safety.flagged ? "text-error font-medium" : ""}>
                          Safety analysis: {safety.severity === "none" || safety.severity === "safe" ? "no concerns" : `${safety.severity} severity`}.{" "}
                          <a href={`/safety/report/${safety.reportId}`} target="_blank" rel="noopener noreferrer" className="underline">
                            Open the safety report
                          </a>
                        </p>
                      )}
                      {safety.kind === "done" && safety.flagged && (
                        <label className="mt-2 flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reviewedFlags}
                            onChange={(e) => setReviewedFlags(e.target.checked)}
                            className="mt-1"
                          />
                          <span>I have read the safety report and still want to publish this recording.</span>
                        </label>
                      )}
                    </div>
                  )}
                  {item.recording_url && (recording === "pending_review" || recording === "published") && (
                    <RecordingPreview
                      key={item.wingtime_id}
                      url={item.recording_url}
                      title={item.topic}
                      isPrivate={recording === "pending_review"}
                    />
                  )}
                  <div className="flex flex-wrap gap-3">
                    {(recording === "pending_review" || recording === "unpublished") && (
                      <button
                        type="button"
                        onClick={() => onRecording("publish", reviewedFlags)}
                        disabled={busy || publishBlockedNow}
                        className={`${actionBtn} bg-[#DCFCE7] text-success`}
                      >
                        {recordingBusy ? "Saving..." : "Publish to Resources"}
                      </button>
                    )}
                    {recording === "pending_review" && (
                      <button
                        type="button"
                        onClick={() => onRecording("reject")}
                        disabled={busy}
                        className={`${actionBtn} border border-[#E5E5E5] bg-white text-[#121212]`}
                      >
                        Don&apos;t Publish
                      </button>
                    )}
                    {recording === "published" && (
                      <button
                        type="button"
                        onClick={() => onRecording("unpublish")}
                        disabled={busy}
                        className={`${actionBtn} border border-[#E5E5E5] bg-white text-[#121212]`}
                      >
                        {recordingBusy ? "Saving..." : "Remove from Resources"}
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onShowParticipants}
                  disabled={busy}
                  className={`${actionBtn} border border-[#E5E5E5] bg-white text-[#121212]`}
                >
                  Participants
                </button>
                {item.status === "approved" && hasEnded(item) && (
                  <button
                    type="button"
                    onClick={onComplete}
                    disabled={busy}
                    className={`${actionBtn} bg-[#DCFCE7] text-success`}
                  >
                    {completing ? "Saving..." : "Mark Completed"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </CenterModal>
  );
}
