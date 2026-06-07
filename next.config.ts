import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep CSS as a separate file, NOT inlined. Measured on this site: inlining
    // the ~30 KB stylesheet into <head> bloated the HTML document enough that it
    // delayed the text LCP more than the saved request helped (simulated LCP
    // ~4.0s inlined vs ~3.8s external). The external stylesheet downloads in
    // parallel and is cacheable, so leave inlining off.
    inlineCss: false,
  },
};

export default nextConfig;
