/** @format */

// NEXT_PUBLIC_* values are inlined into the bundle at build time. A missing value used to turn into
// the literal URL "undefined/api/v1" and every call failed with a confusing network error, so it now
// stops the build (or the dev server) with a clear message instead.
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!rawApiUrl || !/^https?:\/\//.test(rawApiUrl)) {
    throw new Error(
        "NEXT_PUBLIC_API_URL is not set (or is not an http(s) URL). Set it to the backend origin, e.g. https://api.example.org, before building or starting the admin console."
    );
}

export const API_URL = `${rawApiUrl.replace(/\/+$/, "")}/api/v1`;
