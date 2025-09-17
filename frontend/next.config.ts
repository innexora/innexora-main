import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  async rewrites() {
    // In production, we don't need rewrites as API will be on separate domain
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5050/api/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Forwarded-Host",
            value: ":host",
          },
          {
            key: "X-Tenant-Subdomain",
            value: ":subdomain",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
