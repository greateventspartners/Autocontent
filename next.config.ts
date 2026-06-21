import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@smithy/fetch-http-handler"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "muxpcsoxyewfkgnsclyz.supabase.co",
      },
    ],
  },
};

export default nextConfig;
