import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Inline CSS into <head> as <style> instead of a render-blocking <link>.
    // Removes the critical-path CSS request that was delaying LCP. Our global
    // stylesheet is small (~10 KiB transferred), so the loss of separate CSS
    // caching is an easy trade for faster first paint.
    inlineCss: true,
  },
};

export default nextConfig;
