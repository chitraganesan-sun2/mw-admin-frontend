/**
 * Returns `url` only if it is an absolute URL with a safe scheme, otherwise
 * `undefined`. Use this anywhere a URL that came from API data (resource
 * curated links, admin-entered tutorial links, ...) is about to become an
 * `href` — a `javascript:` / `data:` value there executes in the admin origin
 * when clicked, and the admin session cookie is readable from JS.
 */
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function safeHref(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }
  return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : undefined;
}
