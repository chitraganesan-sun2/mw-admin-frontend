// The axios response interceptor (api/api-client.ts) rejects with `{ message, status, data }`.
// Callers read `err.data.detail` directly, which broke two ways: FastAPI 422s send `detail`
// as a list of { loc, msg } objects (toasted as "[object Object]"), and a 429 has no useful
// detail at all. Shared with melody-wings-frontend's utils/apiError.ts.
export function getApiErrorMessage(err: any, fallback = "Something went wrong. Please try again."): string {
    const detail = err?.data?.detail ?? err?.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length) {
        const msgs = detail.map((d: any) => (typeof d === "string" ? d : d?.msg)).filter(Boolean);
        if (msgs.length) return msgs.join(". ");
    }
    if (err?.status === 429) return "Too many requests. Please wait a moment and try again.";
    return fallback;
}
