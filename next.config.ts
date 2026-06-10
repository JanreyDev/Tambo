import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
// Extract origin (e.g., "http://127.0.0.1:8000") from full API URL for rewrite proxy
const apiOrigin = API_URL.replace(/\/api\/v1$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Proxy /api/* and /storage/* to bcmp-api so the browser never hits port 8000 directly.
  // This keeps all origins under 'self', satisfying CSP without extra img-src exceptions.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${apiOrigin}/storage/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=()" },
          ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []), // Prevent HSTS on local dev
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://maps.googleapis.com https://maps.gstatic.com https://unpkg.com",
              "img-src 'self' data: blob: https: https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://unpkg.com https://*.tile.openstreetmap.org",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.kapitan.ph https://api.ipify.org https://*.ingest.us.sentry.io https://maps.googleapis.com https://overpass-api.de https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org",
              "worker-src blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
