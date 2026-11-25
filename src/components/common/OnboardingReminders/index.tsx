"use client";

import React, { useState } from "react";
import { Button } from "antd";
import { endpoints } from "@/api/constants";
import { POST_API } from "@/api/request";
import AlertModal from "@/components/common/Modals/AlertModal";
import { showToast } from "@/components/common/Toast";
import { useCan } from "@/hooks/useStaff";
import { useInFlight } from "@/hooks/useInFlight";
import { getApiErrorMessage } from "@/utils/apiError";

type Role = "learner" | "volunteer";

const LATEST_COUNT = 10;
const SKIP_TEXT: Record<string, string> = {
  too_soon: "was reminded within the last 7 days",
  limit_reached: "has already had both reminders",
  no_email: "has no email on file",
  not_incomplete: "has already submitted the form",
  not_found: "no longer exists",
};

/**
 * "Finish your profile" reminders for members who started signing up but never submitted. `remindOne` emails a
 * single row; `bulkButton` + `modal` email the most recent incomplete accounts after showing how many would get
 * one. The server enforces who can be reminded (incomplete only, 2 max, 7 days apart) - this only drives the UI.
 */
export function useOnboardingReminders(role: Role, onDone: () => void) {
  const canRemind = useCan("broadcast.send");
  const sender = useInFlight();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const noun = role === "learner" ? "learners" : "volunteers";

  const post = (body: Record<string, unknown>) =>
    POST_API(endpoints.onboarding.reminders, { role, ...body }).then((res: any) => res?.data);

  const remindOne = (id: string) =>
    sender.run(async () => {
      setSendingId(id);
      try {
        const out = await post({ ids: [id] });
        if (out?.sent === 1) {
          showToast({ message: "Reminder sent" });
        } else {
          const reason = out?.skipped?.[0]?.reason;
          showToast({
            type: "error",
            message: out?.failed
              ? "Couldn't send the reminder. Please try again."
              : `Not sent: this ${role} ${SKIP_TEXT[reason] ?? "can't be reminded right now"}.`,
          });
        }
        onDone();
      } catch (err) {
        showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't send the reminder. Please try again.") });
      } finally {
        setSendingId(null);
      }
    });

  // Step 1: a dry run, so the admin sees the real number before anything is emailed.
  const openBulk = () =>
    sender.run(async () => {
      try {
        const out = await post({ latest: LATEST_COUNT, dry_run: true });
        if (!out?.sent) {
          showToast({ type: "error", message: `No ${noun} can be reminded right now.` });
          return;
        }
        setPendingCount(out.sent);
      } catch (err) {
        showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't check who to remind. Please try again.") });
      }
    });

  // Step 2: send to the same most-recent set.
  const confirmBulk = () =>
    sender.run(async () => {
      try {
        const out = await post({ latest: LATEST_COUNT });
        showToast({
          type: out?.failed ? "error" : "success",
          message: out?.failed
            ? `${out.sent} sent, ${out.failed} couldn't be sent. Try those again.`
            : `${out?.sent ?? 0} reminder${out?.sent === 1 ? "" : "s"} sent`,
        });
        onDone();
      } catch (err) {
        showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't send the reminders. Please try again.") });
      } finally {
        setPendingCount(null);
      }
    });

  const bulkButton = canRemind ? (
    <Button disabled={sender.pending} aria-busy={sender.pending} onClick={openBulk}>
      {`Remind latest ${LATEST_COUNT} incomplete`}
    </Button>
  ) : null;

  const modal = (
    <AlertModal
      isOpen={pendingCount !== null}
      onClose={() => setPendingCount(null)}
      onPrimaryAction={confirmBulk}
      type="info"
      title="Send reminders"
      description={`Email ${pendingCount ?? 0} ${noun} who started signing up but never submitted the form, asking them to finish their profile? Anyone reminded in the last 7 days, or twice already, is skipped.`}
      primaryActionText="Yes, Send"
      isLoading={sender.pending}
    />
  );

  return { canRemind, remindOne, sendingId, bulkButton, modal };
}
