/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const apiOrigin = apiUrl ? new URL(apiUrl).origin : "";

const safetyDashboardUrl = process.env.NEXT_PUBLIC_SAFETY_DASHBOARD_URL || "";
const safetyOrigin = safetyDashboardUrl
    ? new URL(safetyDashboardUrl).origin
    : "";

// App-wide Content-Security-Policy. 'unsafe-inline'/'unsafe-eval' stay on
// script-src because Next's runtime + antd need them and this app has no nonce
// pipeline; the value here is still that connect-src / img-src / frame-src are
// locked to known origins, so an injected script can't exfiltrate the (JS-
// readable) admin cookie to an attacker host, and the frame directives stop the
// console being embedded anywhere.
const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    `connect-src 'self'${apiOrigin ? " " + apiOrigin : ""}${safetyOrigin ? " " + safetyOrigin : ""}`,
    `frame-src ${safetyOrigin || "'none'"}`,
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
];

const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                pathname: "/dxezkqczp/**",
            },
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
