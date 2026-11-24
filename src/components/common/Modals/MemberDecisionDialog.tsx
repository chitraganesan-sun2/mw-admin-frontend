"use client";

import React from "react";
import { Modal } from "antd";

export const REJECTION_REASON_MAX = 2000;

export type MemberDecision = "accept" | "reject";

interface Props {
  decision: MemberDecision | null;
  memberKind: "volunteer" | "learner";
  memberName: string;
  reason: string;
  onReasonChange: (value: string) => void;
  /** True while the request is running: both buttons lock and the dialog can't be dismissed. */
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The confirmation step for approving or rejecting an application. Both outcomes send the applicant
 * an email and can't be taken back from this screen, so the admin sees who it is, what will happen,
 * and (for a rejection) the reason that goes into the email before the final click.
 */
const MemberDecisionDialog = ({ decision, memberKind, memberName, reason, onReasonChange, pending, onConfirm, onCancel }: Props) => {
  const who = memberName?.trim() || `this ${memberKind}`;
  const isReject = decision === "reject";
  return (
    <Modal
      open={decision !== null}
      title={isReject ? `Reject ${who}?` : `Accept ${who}?`}
      okText={isReject ? "Yes, reject" : "Yes, accept"}
      cancelText="Cancel"
      okButtonProps={{ danger: isReject, loading: pending, disabled: pending }}
      cancelButtonProps={{ disabled: pending }}
      onOk={onConfirm}
      onCancel={pending ? undefined : onCancel}
      maskClosable={!pending}
      keyboard={!pending}
      closable={!pending}
      centered
      destroyOnClose
      zIndex={1100}
    >
      {isReject ? (
        <>
          <p className="mb-3 text-sm">
            This rejects {who}&apos;s application and <strong>sends them an email</strong> right away. If you write a reason
            below, it is included in that email.
          </p>
          <label htmlFor="member-rejection-reason" className="mb-1 block text-sm font-medium">
            Reason (optional)
          </label>
          <textarea
            id="member-rejection-reason"
            value={reason}
            maxLength={REJECTION_REASON_MAX}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={pending}
            placeholder="Let the applicant know why their application wasn't approved."
            className="min-h-[110px] w-full rounded-xl border border-stroke p-3 text-sm font-[inherit] focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-brand-ink"
          />
          <p className="mt-1 text-right text-xs text-ink-2" aria-live="polite">
            {reason.length} / {REJECTION_REASON_MAX}
          </p>
        </>
      ) : (
        <p className="text-sm">
          This approves {who}&apos;s application as a {memberKind} and <strong>sends them an email</strong> to let them know.
        </p>
      )}
    </Modal>
  );
};

export default MemberDecisionDialog;
