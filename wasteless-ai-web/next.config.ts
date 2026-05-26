import type { NextConfig } from "next";
import { apiEnv } from "./src/env/node";

const isProd = process.env.NODE_ENV === "production";
const apiCorsOrigin = apiEnv().API_CORS_ORIGIN ?? (isProd ? undefined : "http://localhost:8083");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          ...(apiCorsOrigin ? [{ key: "Access-Control-Allow-Origin", value: apiCorsOrigin }] : []),
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Vary", value: "Origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
