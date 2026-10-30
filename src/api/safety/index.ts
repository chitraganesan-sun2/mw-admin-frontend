import { endpoints } from "../constants";
import { DELETE_API, GET_API, POST_API } from "../request";
import { request } from "../api-client";
import { downloadFile } from "@/utils/downloadFile";

// Every call goes to the MelodyWings backend with the admin's own token; the browser never talks
// to the detection pipeline. Each function resolves to the response body and rejects with the
// shared `{ message, status, data }` error (use getApiErrorMessage to read it).

const body = <T,>(response: any): T => response.data as T;

const withLinks = (form: FormData, links?: SafetyAnalysisLinks) => {
  (["session_id", "volunteer_id", "learner_id"] as const).forEach((key) => {
    const value = links?.[key]?.trim();
    if (value) form.append(key, value);
  });
  return form;
};

// ── Reports ──────────────────────────────────────────────────────────────────

export const listSafetyReports = async (
  params: { skip?: number; limit?: number; severity?: string; session_id?: string } = {}
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return body<SafetyReportList>(await GET_API(`${endpoints.safety.reports}?${query.toString()}`));
};

export const getSafetyReport = async (id: number | string) =>
  body<SafetyReport>(await GET_API(endpoints.safety.report(id)));

export const getSafetyReportStatus = async (id: number | string) =>
  body<SafetyReportStatus>(await GET_API(endpoints.safety.status(id)));

export const getSafetyReportStats = async (id: number | string) =>
  body<SafetyReportStats>(await GET_API(endpoints.safety.stats(id)));

export const deleteSafetyReport = async (id: number | string) => {
  await DELETE_API(endpoints.safety.report(id));
};

export const bulkDeleteSafetyReports = async (ids: number[]) =>
  body<SafetyBulkDeleteResult>(await POST_API(endpoints.safety.bulkDelete, { ids }));

/** Saves the report's PDF through the authenticated client (a plain link can't send the token). */
export const downloadSafetyReportPdf = (id: number | string) =>
  downloadFile(
    endpoints.safety.pdf(id),
    `safety_report_${id}.pdf`,
    "Couldn't download the PDF. Please try again."
  );

export const emailSafetyReport = async (
  id: number | string,
  kind: "alert" | "summary" | "admin",
  recipients: string[] = []
) =>
  body<Record<string, unknown>>(
    await POST_API(endpoints.safety.email(id, kind), { recipients: recipients.length ? recipients : null })
  );

// ── Submitting an analysis ───────────────────────────────────────────────────

type UploadOptions = { links?: SafetyAnalysisLinks; onProgress?: (percent: number) => void };

const upload = async (url: string, file: File, { links, onProgress }: UploadOptions, timeout: number) => {
  const form = withLinks(new FormData(), links);
  form.append("file", file);
  const response = await request({
    method: "POST",
    url,
    data: form,
    timeout,
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return body<SafetyAcceptedAnalysis>(response);
};

export const analyzeAudio = (file: File, options: UploadOptions = {}) =>
  upload(endpoints.safety.analyzeAudio, file, options, 600_000);

export const analyzeVideo = (file: File, options: UploadOptions = {}) =>
  upload(endpoints.safety.analyzeVideo, file, options, 1_800_000);

export const analyzeTranscriptFile = (file: File, options: UploadOptions = {}) =>
  upload(endpoints.safety.analyzeTranscriptFile, file, options, 600_000);

export const analyzeTranscriptText = async (
  transcript: string,
  filename = "transcript_input.txt",
  links: SafetyAnalysisLinks = {}
) =>
  body<SafetyAcceptedAnalysis>(
    await POST_API(endpoints.safety.analyzeTranscript, { transcript, filename, ...links })
  );

// ── Analytics, chat ──────────────────────────────────────────────────────────

export const getSafetyAnalytics = async () =>
  body<SafetyAnalyticsSummary>(await GET_API(endpoints.safety.analytics));

export const getSafetyInsights = async () =>
  body<{ insights: string } & Record<string, unknown>>(await GET_API(endpoints.safety.insights));

export const askSafetyReport = async (reportId: number, question: string) =>
  body<SafetyChatAnswer>(await POST_API(endpoints.safety.chat, { report_id: reportId, question }));

// ── Google Drive ─────────────────────────────────────────────────────────────

export const getDriveStatus = async () => body<SafetyDriveStatus>(await GET_API(endpoints.safety.drive.status));

export const getDriveAuthUrl = async () =>
  body<{ auth_url: string }>(await GET_API(endpoints.safety.drive.authUrl));

export const listDriveFiles = async (pageSize = 50, search?: string) => {
  const query = new URLSearchParams({ page_size: String(pageSize) });
  if (search) query.set("search", search);
  return body<{ files: Array<Record<string, any>>; [key: string]: unknown }>(
    await GET_API(`${endpoints.safety.drive.files}?${query.toString()}`)
  );
};

export const importDriveFile = async (fileId: string, fileName: string, mimeType: string) =>
  body<{ id: number; filename: string; status: string; message: string; source: string }>(
    await POST_API(endpoints.safety.drive.import, { file_id: fileId, file_name: fileName, mime_type: mimeType })
  );

export const disconnectDrive = async () => body<{ message: string }>(await DELETE_API(endpoints.safety.drive.disconnect));

export const getDriveWatcher = async () =>
  body<SafetyDriveWatcherStatus>(await GET_API(endpoints.safety.drive.watcher));

export const startDriveWatcher = async () =>
  body<{ message: string; status: SafetyDriveWatcherStatus }>(await POST_API(endpoints.safety.drive.watcherStart, {}));

export const stopDriveWatcher = async () =>
  body<{ message: string; status: SafetyDriveWatcherStatus }>(await POST_API(endpoints.safety.drive.watcherStop, {}));
