/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
// A malformed value (e.g. missing scheme) used to throw here and fail the whole build.
const originOf = (value) => {
    try {
        return value ? new URL(value).origin : "";
    } catch {
        console.warn(`next.config.js: ignoring malformed URL "${value}"`);
        return "";
    }
};
const apiOrigin = originOf(apiUrl);

// Where uploaded pictures and videos are served from (profile pictures, post/resource images, the
// About-Me video). The backend stores media on Cloudinary and Cloudflare R2; R2's public URL is a
// deployment setting (an *.r2.dev host or a custom domain), so a custom domain is added at build
// time with NEXT_PUBLIC_MEDIA_ORIGINS="https://media.example.org,https://cdn.example.org".
const extraMediaOrigins = (process.env.NEXT_PUBLIC_MEDIA_ORIGINS || "")
    .split(",")
    .map((value) => originOf(value.trim()))
    .filter(Boolean);
const mediaSources = ["https://res.cloudinary.com", "https://*.r2.dev", ...extraMediaOrigins].join(" ");

// App-wide Content-Security-Policy. 'unsafe-inline'/'unsafe-eval' stay on
// script-src because Next's runtime + antd need them and this app has no nonce
// pipeline; the value here is still that connect-src / img-src / frame-src are
// locked to known origins, so an injected script can't exfiltrate the (JS-
// readable) admin cookie to an attacker host, and the frame directives stop the
// console being embedded anywhere.
const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: ${mediaSources}`,
    // Without media-src the browser falls back to default-src 'self' and blocks every uploaded video.
    `media-src 'self' blob: ${mediaSources}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    // Sentry's ingest domain - without this, every crash-report event is
    // silently blocked by the browser before it ever reaches Sentry (caught the
    // hard way on melody-wings-frontend's own Sentry rollout).
    `connect-src 'self' https://o4509546502684672.ingest.us.sentry.io${apiOrigin ? " " + apiOrigin : ""}`,
    // Only the click-to-play preview of a recorded WingTime (wingtime/RecordingPreview) is embedded;
    // Safety Monitoring is native, it no longer frames an external dashboard.
    "frame-src https://drive.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
].join("; ");

const securityHeaders = [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // UAT build (NEXT_PUBLIC_APP_ENV=uat on Vercel's Preview scope): never let a search engine index it.
    ...(process.env.NEXT_PUBLIC_APP_ENV === "uat"
        ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
        : []),
];

const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        remotePatterns: [
            // Any Cloudinary account: the pinned account path rejected pictures from other
            // accounts (the backend's email logo, for one, lives in a different one).
            { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
            { protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
            ...extraMediaOrigins.map((origin) => ({
                protocol: "https",
                hostname: new URL(origin).hostname,
                pathname: "/**",
            })),
        ],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

module.exports = nextConfig;
