import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The scaffold writes AGENTS.md/CLAUDE.md on every dev boot; this repo
  // manages its own docs.
  agentRules: false,

  // Next 16 rejects dev requests (including the HMR socket) from origins it
  // doesn't recognise, which breaks hydration when the app is opened on a
  // loopback IP or through a tunnel rather than "localhost".
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // The floating dev badge overlaps the bottom-left of the UI.
  devIndicators: false,

  images: {
    // Screenshot previews and share cards are served from the configured
    // storage provider, which can be any host.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
