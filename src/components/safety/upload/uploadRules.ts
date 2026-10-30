// What the analysis endpoints accept. These mirror the backend's limits so a bad file is rejected
// here, before a large upload is sent, with a message the admin can act on. The backend still
// enforces them; its own message is shown if it rejects anyway.

export type UploadKind = "audio" | "video" | "transcript-file" | "transcript-text";

const MB = 1024 * 1024;

export const FILE_RULES: Record<
  Exclude<UploadKind, "transcript-text">,
  { label: string; extensions: string[]; maxBytes: number }
> = {
  audio: { label: "audio", extensions: [".mp3", ".wav", ".m4a", ".aac", ".ogg"], maxBytes: 200 * MB },
  video: { label: "video", extensions: [".mp4", ".mkv", ".avi", ".mov", ".webm", ".flv", ".wmv"], maxBytes: 500 * MB },
  "transcript-file": { label: "transcript", extensions: [".txt"], maxBytes: 10 * MB },
};

export const TRANSCRIPT_MIN_CHARS = 10;
export const TRANSCRIPT_MAX_CHARS = 500_000;
export const LINK_MAX_CHARS = 100;
export const MAX_CONCURRENT_UPLOADS = 2;

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 2 : 1)} MB`;
};

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
};

/** Returns a message when the file can't be analysed as this kind, otherwise null. */
export const validateFile = (file: File, kind: Exclude<UploadKind, "transcript-text">): string | null => {
  const rule = FILE_RULES[kind];
  if (!rule.extensions.includes(extensionOf(file.name))) {
    return `"${file.name}" isn't a supported ${rule.label} format. Allowed: ${rule.extensions.join(", ")}.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > rule.maxBytes) {
    return `"${file.name}" is ${formatBytes(file.size)}, over the ${rule.maxBytes / MB} MB limit for ${rule.label} files.`;
  }
  return null;
};

/** Returns a message when the pasted transcript can't be analysed, otherwise null. */
export const validateTranscriptText = (text: string): string | null => {
  const length = text.trim().length;
  if (length < TRANSCRIPT_MIN_CHARS) {
    return `The transcript needs at least ${TRANSCRIPT_MIN_CHARS} characters.`;
  }
  if (length > TRANSCRIPT_MAX_CHARS) {
    return `The transcript is ${length.toLocaleString()} characters, over the ${TRANSCRIPT_MAX_CHARS.toLocaleString()} character limit.`;
  }
  return null;
};

// ── Queue ────────────────────────────────────────────────────────────────────

export type QueueStatus = "waiting" | "uploading" | "accepted" | "failed";

export interface QueueItem {
  key: string;
  kind: UploadKind;
  name: string;
  size: number;
  file?: File;
  /** Pasted transcripts only: the text, and the filename it is sent under. */
  text?: string;
  filename?: string;
  status: QueueStatus;
  /** True once the admin pressed "Start analysis"; waiting items without it stay put. */
  started: boolean;
  progress: number;
  error?: string;
  reportId?: number;
  links: SafetyAnalysisLinks;
}

export const KIND_LABELS: Record<UploadKind, string> = {
  audio: "Audio",
  video: "Video",
  "transcript-file": "Transcript file",
  "transcript-text": "Pasted transcript",
};
