import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "22mb" } },
  poweredByHeader: false,
};

export default config;
