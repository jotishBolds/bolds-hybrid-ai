/**
 * TypeScript Configuration for Next.js Hybrid RAG Chatbot
 * Extends the base Next.js TypeScript configuration
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Neo4j Configuration
      NEO4J_URI: string;
      NEO4J_USER: string;
      NEO4J_PASSWORD: string;

      // Pinecone Configuration
      PINECONE_API_KEY: string;
      PINECONE_HOST: string;
      PINECONE_INDEX_NAME: string;
      PINECONE_VECTOR_DIM: string;
      PINECONE_TOP_K: string;

      // LLM Configuration
      LLM_PROVIDER: "openai" | "huggingface";
      OPENAI_API_KEY?: string;
      HUGGINGFACE_API_KEY?: string;

      // Next.js Configuration
      NEXT_PUBLIC_API_BASE_URL?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
