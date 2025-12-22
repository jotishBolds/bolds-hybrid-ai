import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server components (Next.js 16+)
  serverExternalPackages: ["@xenova/transformers"],

  // Turbopack configuration for Next.js 16+
  turbopack: {
    // Empty config to silence warnings and enable Turbopack
  },

  // Environment variables for runtime
  env: {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_HOST: process.env.PINECONE_HOST,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME,
    LLM_PROVIDER: process.env.LLM_PROVIDER,
  },
};

export default nextConfig;
