import type { NextConfig } from "next";

function normalizeAllowedDevOrigin(origin: string) {
  const trimmedOrigin = origin.trim();

  if (!trimmedOrigin) {
    return null;
  }

  const originWithoutProtocol = trimmedOrigin.replace(/^https?:\/\//, "");
  const host = originWithoutProtocol.split(":")[0];

  return host || null;
}

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").flatMap((origin) => {
      const normalizedOrigin = normalizeAllowedDevOrigin(origin);

      return normalizedOrigin ? [normalizedOrigin] : [];
    })
  : [];

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins,
};

export default nextConfig;
