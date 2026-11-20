// Builds a query string with every value percent-encoded (a search for "R&D" or "a+b" used to
// split into extra parameters). Empty / null / undefined values are left out.
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined || value === "") continue;
        search.set(key, String(value));
    }
    return search.toString();
}

/** `path` plus a query string built by `buildQuery` (no trailing "?" when there are no parameters). */
export function withQuery(path: string, params: Record<string, string | number | boolean | null | undefined>): string {
    const qs = buildQuery(params);
    return qs ? `${path}?${qs}` : path;
}
