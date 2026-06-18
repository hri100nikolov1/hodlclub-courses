import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the gated book PDF is bundled with its API route on Vercel
  outputFileTracingIncludes: {
    '/api/book/pdf': ['./book-assets/**'],
    '/api/book/checklist': ['./book-assets/**'],
  },
};

export default nextConfig;
