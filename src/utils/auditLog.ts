// Audit entries carry a machine slug ("learner.delete", "mail.send"). Show people words.

const VERBS: Record<string, string> = {
  delete: "deleted",
  create: "created",
  update: "updated",
  approve: "approved",
  reject: "rejected",
  send: "sent",
  export: "exported",
  publish: "published",
  login: "signed in",
};

const titleCase = (s: string) => s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** "learner.delete" -> "Learner deleted"; unknown verbs fall back to their own words. */
export function describeAction(slug: string): string {
  const [subject, ...rest] = (slug || "").split(".");
  if (!subject) return "-";
  const verbSlug = rest.join(" ");
  if (!verbSlug) return titleCase(subject);
  const verb = VERBS[verbSlug] ?? verbSlug.replace(/[_-]+/g, " ");
  return `${titleCase(subject)} ${verb}`;
}

/** First 8 characters of an id: enough to tell rows apart, short enough for a table. */
export const shortId = (id?: string | null): string => (id ? id.slice(0, 8) : "-");

/** Metadata as short "key: value" lines for the expanded row (objects are JSON-ed). */
export function metadataLines(metadata: Record<string, unknown> | null | undefined): string[] {
  return Object.entries(metadata ?? {}).map(([k, v]) => `${k}: ${typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}`);
}
