import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    externalDir: true,
  },
  serverExternalPackages: ["pg", "@azure/identity", "@azure/keyvault-secrets"],
};

export default nextConfig;
