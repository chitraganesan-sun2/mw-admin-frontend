// Small pure helpers for the Google Drive import screen.

export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
export const TEXT_MIME = "text/plain";

export const PAGE_SIZE_OPTIONS = [25, 50, 100];
export const DEFAULT_PAGE_SIZE = 50;

/** A Drive file in the shape this screen uses (the service sends Google's camelCase fields). */
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  webViewLink: string | null;
}

/** Reads one raw Drive file defensively; returns null for anything that can't be imported. */
export const normaliseDriveFile = (raw: Record<string, any>): DriveFile | null => {
  const id = typeof raw?.id === "string" ? raw.id : "";
  if (!id) return null;
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name : "Untitled";
  return {
    id,
    name,
    mimeType: String(raw.mimeType ?? raw.mime_type ?? ""),
    modifiedTime: raw.modifiedTime ?? raw.modified_time ?? null,
    webViewLink: isSafeDriveLink(raw.webViewLink ?? raw.web_view_link) ? (raw.webViewLink ?? raw.web_view_link) : null,
  };
};

export const mimeLabel = (mimeType: string): string => {
  if (mimeType === GOOGLE_DOC_MIME) return "Google Doc";
  if (mimeType === TEXT_MIME) return "Text file (.txt)";
  return mimeType || "Unknown";
};

/** Only https links to Google are rendered as links; anything else is dropped. */
export const isSafeDriveLink = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)google\.com$/.test(url.hostname);
  } catch {
    return false;
  }
};

/** The consent screen is the only place the browser may be sent to connect Drive. */
export const isGoogleConsentUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.origin === "https://accounts.google.com";
  } catch {
    return false;
  }
};

export type DriveErrorKind = "not-connected" | "unavailable" | "error";

/** 409 = Drive isn't connected; 502/503/504 = the safety service can't be reached. */
export const driveErrorKind = (err: any): DriveErrorKind => {
  const status = err?.status ?? err?.response?.status;
  if (status === 409) return "not-connected";
  if (status === 502 || status === 503 || status === 504) return "unavailable";
  return "error";
};

const CALLBACK_REASONS: Record<string, string> = {
  access_denied: "Access was declined on the Google sign-in screen.",
  missing_code: "Google didn't send back an authorisation code.",
  token_exchange_failed: "The connection couldn't be completed with Google.",
};

/** The `reason` query value is untrusted: cap it and use it as plain text only. */
export const describeCallbackReason = (reason: string | null): string => {
  const cleaned = (reason ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 120);
  if (!cleaned) return "Something went wrong.";
  return CALLBACK_REASONS[cleaned] ?? `Google reported: ${cleaned}`;
};
