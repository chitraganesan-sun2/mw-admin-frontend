/** @type {import('next').NextConfig} */

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
};

module.exports = nextConfig;