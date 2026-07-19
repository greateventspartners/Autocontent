import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client-runtime-utils"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = { ...config.experiments, asyncWebAssembly: true };
    }
    return config;
  },
};

export default nextConfig;
