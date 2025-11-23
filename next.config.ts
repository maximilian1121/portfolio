import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://avatars.githubusercontent.com/u/168935358')],
  },
};

export default nextConfig;
