/** @type {import('next').NextConfig} */

const safetyDashboardUrl = process.env.NEXT_PUBLIC_SAFETY_DASHBOARD_URL || "";
const safetyOrigin = safetyDashboardUrl
    ? new URL(safetyDashboardUrl).origin
    : "";

const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "res.cloudinary.com",
                pathname: "/dxezkqczp/**",
            },
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
                source: "/safety",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `frame-src ${safetyOrigin || "'none'"};`,
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;