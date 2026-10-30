"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Input, Modal, Radio } from "antd";
import { FiDownload, FiMail, FiMessageSquare, FiTrash2 } from "react-icons/fi";
import { deleteSafetyReport, downloadSafetyReportPdf, emailSafetyReport } from "@/api/safety";
import { showToast } from "@/components/common/Toast";
import { getApiErrorMessage } from "@/utils/apiError";
import { SeverityTag } from "../SeverityTag";
import { formatRisk, isInFlight } from "../severity";

type EmailKind = "alert" | "summary" | "admin";

const EMAIL_KINDS: { value: EmailKind; label: string; description: string }[] = [
  { value: "alert", label: "Parent alert", description: "A short, parent-friendly notice that a conversation raised safety concerns." },
  { value: "summary", label: "Summary", description: "The analysis summary with the main findings." },
  { value: "admin", label: "Full report", description: "The complete report for the safeguarding team, including the evidence quoted." },
];

const MAX_RECIPIENTS = 10;
const EMAIL_PATTERN = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Splits "a@x.com, b@y.com" into a de-duplicated list and reports the first problem, if any. */
export function parseRecipients(text: string): { emails: string[]; error: string | null } {
  const parts = text.split(/[\s,;]+/).filter(Boolean);
  const emails = Array.from(new Set(parts.map((p) => p.toLowerCase())));
  const invalid = emails.filter((e) => !EMAIL_PATTERN.test(e));
  if (invalid.length) {
    return { emails, error: `${invalid.length === 1 ? "This isn't" : "These aren't"} a valid email address: ${invalid.join(", ")}` };
  }
  if (emails.length > MAX_RECIPIENTS) {
    return { emails, error: `You can send to at most ${MAX_RECIPIENTS} recipients at a time (you entered ${emails.length}).` };
  }
  return { emails, error: null };
}

function EmailDialog({ report, open, onClose }: { report: SafetyReport; open: boolean; onClose: () => void }) {
  const uid = useId();
  const [kind, setKind] = useState<EmailKind>("alert");
  const [recipientText, setRecipientText] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const reset = () => {
    setStep("form");
    setFieldError(null);
    setSendError(null);
  };
  const close = () => {
    onClose();
    reset();
  };

  const { emails } = parseRecipients(recipientText);
  const kindInfo = EMAIL_KINDS.find((k) => k.value === kind) as (typeof EMAIL_KINDS)[number];

  const send = useMutation({
    mutationFn: () => emailSafetyReport(report.id, kind, emails),
    onSuccess: (res) => {
      const message = typeof res?.message === "string" && res.message.trim() ? res.message : "Email sent.";
      showToast({ type: "success", message });
      close();
    },
    onError: (err) => {
      // The backend's own wording (for example "email is not configured") is shown as it is.
      const message =
        getApiErrorMessage(err, "") ||
        (typeof (err as any)?.data?.message === "string" ? (err as any).data.message : "") ||
        "Couldn't send the email. Please try again.";
      setSendError(message);
      setStep("form");
      showToast({ type: "error", message });
    },
  });

  const review = () => {
    const parsed = parseRecipients(recipientText);
    if (parsed.error) {
      setFieldError(parsed.error);
      return;
    }
    setFieldError(null);
    setSendError(null);
    setStep("confirm");
  };

  return (
    <Modal
      open={open}
      title={step === "form" ? "Email this report" : "Send this email?"}
      onCancel={send.isPending ? undefined : close}
      maskClosable={!send.isPending}
      destroyOnClose
      footer={
        step === "form"
          ? [
              <Button key="cancel" onClick={close}>
                Cancel
              </Button>,
              <Button key="review" type="primary" onClick={review}>
                Review and send
              </Button>,
            ]
          : [
              <Button key="back" onClick={() => setStep("form")} disabled={send.isPending}>
                Back
              </Button>,
              <Button key="send" type="primary" danger loading={send.isPending} onClick={() => send.mutate()}>
                Send email
              </Button>,
            ]
      }
    >
      {step === "form" ? (
        <div className="flex flex-col gap-4">
          {sendError && <Alert type="error" showIcon message="The email was not sent" description={sendError} />}
          <div>
            <span id={`${uid}-kind`} className="block text-sm font-medium mb-2">
              What to send
            </span>
            <Radio.Group
              aria-labelledby={`${uid}-kind`}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="!flex !flex-col gap-2"
            >
              {EMAIL_KINDS.map((k) => (
                <Radio key={k.value} value={k.value} className="!items-start">
                  <span className="font-medium">{k.label}</span>
                  <span className="block text-xs text-gray-500">{k.description}</span>
                </Radio>
              ))}
            </Radio.Group>
          </div>
          <div>
            <label htmlFor={`${uid}-to`} className="block text-sm font-medium mb-1">
              Recipients (optional)
            </label>
            <Input.TextArea
              id={`${uid}-to`}
              rows={2}
              value={recipientText}
              status={fieldError ? "error" : undefined}
              aria-describedby={`${uid}-to-help`}
              aria-invalid={!!fieldError}
              placeholder="name@example.org, other@example.org"
              onChange={(e) => {
                setRecipientText(e.target.value);
                setFieldError(null);
              }}
            />
            <p id={`${uid}-to-help`} className={`text-xs mt-1 ${fieldError ? "text-red-600" : "text-gray-500"}`} role={fieldError ? "alert" : undefined}>
              {fieldError ?? `Separate addresses with commas. Up to ${MAX_RECIPIENTS}. Leave blank to use the recipients set up on the server.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          <Alert
            type="warning"
            showIcon
            message="This email contains child-safety findings"
            description="Check the recipients before sending. Emails can't be recalled."
          />
          <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5">
            <dt className="text-gray-500">Report</dt>
            <dd className="break-all">
              #{report.id} - {report.filename}
            </dd>
            <dt className="text-gray-500">Email</dt>
            <dd>
              {kindInfo.label}: {kindInfo.description}
            </dd>
            <dt className="text-gray-500">To</dt>
            <dd className="break-all">{emails.length ? emails.join(", ") : "The recipients set up on the server"}</dd>
          </dl>
        </div>
      )}
    </Modal>
  );
}

function DeleteDialog({ report, open, onClose }: { report: SafetyReport; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: () => deleteSafetyReport(report.id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["safety-report", String(report.id)] });
      queryClient.removeQueries({ queryKey: ["safety-report-status", String(report.id)] });
      queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("safety") });
      showToast({ type: "success", message: "Report deleted." });
      router.push("/safety");
    },
    onError: (err) => showToast({ type: "error", message: getApiErrorMessage(err, "Couldn't delete the report. Please try again.") }),
  });

  return (
    <Modal
      open={open}
      title="Delete this report?"
      onCancel={remove.isPending ? undefined : onClose}
      maskClosable={!remove.isPending}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose} disabled={remove.isPending}>
          Cancel
        </Button>,
        <Button key="delete" type="primary" danger loading={remove.isPending} onClick={() => remove.mutate()}>
          Delete report
        </Button>,
      ]}
    >
      <p className="text-sm text-gray-700 mb-3">
        This permanently deletes the report with its findings and transcript. It can&apos;t be undone.
      </p>
      <div className="bg-gray-50 border border-gray-100 rounded-md p-3 text-sm flex flex-col gap-1.5">
        <span className="text-gray-500">Report #{report.id}</span>
        <span className="font-medium break-all">{report.filename}</span>
        <span className="flex items-center gap-2">
          <SeverityTag severity={report.severity} />
          <span className="text-gray-600">Risk score {formatRisk(report.risk_score)}</span>
        </span>
      </div>
    </Modal>
  );
}

export default function ReportActions({
  report,
  chatOpen,
  onToggleChat,
}: {
  report: SafetyReport;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const ready = String(report.status).toUpperCase() === "COMPLETED";
  const running = isInFlight(report.status);
  const whyDisabled = running ? "Available once the analysis finishes" : "Only available for completed analyses";

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadSafetyReportPdf(report.id); // shows its own error toast
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Report actions">
        <Button icon={<FiDownload aria-hidden="true" />} onClick={downloadPdf} loading={downloading} disabled={!ready} title={ready ? undefined : whyDisabled}>
          Download PDF
        </Button>
        <Button icon={<FiMail aria-hidden="true" />} onClick={() => setEmailOpen(true)} disabled={!ready} title={ready ? undefined : whyDisabled}>
          Email report
        </Button>
        <Button
          type={chatOpen ? "primary" : "default"}
          icon={<FiMessageSquare aria-hidden="true" />}
          aria-pressed={chatOpen}
          onClick={onToggleChat}
          disabled={!ready}
          title={ready ? undefined : whyDisabled}
        >
          {chatOpen ? "Close chat" : "Ask about this report"}
        </Button>
        <Button danger icon={<FiTrash2 aria-hidden="true" />} onClick={() => setDeleteOpen(true)}>
          Delete
        </Button>
      </div>
      <EmailDialog report={report} open={emailOpen} onClose={() => setEmailOpen(false)} />
      <DeleteDialog report={report} open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </>
  );
}
