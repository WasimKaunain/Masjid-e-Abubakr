import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/images/mosque/**",
      },
    ],
  },
};

export default nextConfig;
