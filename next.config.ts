import type { NextConfig } from "next";
import { buildSecurityPolicy, nextHeaderList } from "./config/security-headers";
import { cacheHeaderRules } from "./config/cache-headers";

const securityPolicy = buildSecurityPolicy();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: nextHeaderList(securityPolicy).map((header) => ({
          key: header.key,
          value: header.value,
        })),
      },
      // See docs/cache-policy.md for the per-route Cache-Control rationale.
      ...cacheHeaderRules().map(({ source, headers }) => ({ source, headers })),
    ];
  },
};

export default nextConfig;
