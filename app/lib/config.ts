/**
 * Configuration utilities for the Hybrid AI Travel Assistant
 * This file handles environment variable validation and provides typed configuration
 * Similar to the Python config.py but adapted for Next.js server-side usage
 */

/**
 * Interface defining all configuration options for the application
 */
export interface Config {
  // Neo4j Graph Database Configuration
  neo4j: {
    uri: string; // Connection URI for Neo4j instance (e.g., neo4j+s://xxx.databases.neo4j.io)
    user: string; // Neo4j username (typically "neo4j")
    password: string; // Neo4j password
  };

  // Pinecone Vector Database Configuration
  pinecone: {
    apiKey: string; // Pinecone API key from dashboard
    host: string; // Pinecone index host URL
    indexName: string; // Name of the Pinecone index
    vectorDim: number; // Dimension of embeddings (1024 for BAAI/bge-large-en-v1.5)
    topK: number; // Number of similar results to retrieve
  };

  // Large Language Model Configuration
  llm: {
    provider: "openai" | "huggingface"; // Which LLM provider to use
    openaiApiKey?: string; // OpenAI API key (if provider=openai)
    huggingfaceApiKey?: string; // HuggingFace token (if provider=huggingface)
  };
}

/**
 * Get and validate configuration from environment variables
 * Throws error if required variables are missing or invalid
 *
 * @returns Validated configuration object
 */
export function getConfig(): Config {
  // Extract all environment variables with fallbacks
  const neo4jUri = process.env.NEO4J_URI || "";
  const neo4jUser = process.env.NEO4J_USER || "neo4j";
  const neo4jPassword = process.env.NEO4J_PASSWORD || "";

  const pineconeApiKey = process.env.PINECONE_API_KEY || "";
  const pineconeHost = process.env.PINECONE_HOST || "";
  const pineconeIndexName =
    process.env.PINECONE_INDEX_NAME || "sikkim-service-rule";
  const pineconeVectorDim = parseInt(process.env.PINECONE_VECTOR_DIM || "1024");
  const pineconeTopK = parseInt(process.env.PINECONE_TOP_K || "5");

  const llmProvider = (process.env.LLM_PROVIDER || "huggingface") as
    | "openai"
    | "huggingface";
  const openaiApiKey = process.env.OPENAI_API_KEY || "";
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY || "";

  // Validation array to collect all errors
  const errors: string[] = [];

  // Validate Neo4j configuration
  if (!neo4jUri || neo4jUri.includes("your-neo4j-uri")) {
    errors.push("NEO4J_URI is not properly configured");
  }
  if (!neo4jPassword) {
    errors.push("NEO4J_PASSWORD is not set");
  }

  // Validate Pinecone configuration
  if (!pineconeApiKey) {
    errors.push("PINECONE_API_KEY is not set");
  }
  if (!pineconeHost) {
    errors.push("PINECONE_HOST is not set");
  }

  // Validate LLM provider credentials
  if (llmProvider === "openai" && !openaiApiKey) {
    errors.push("OPENAI_API_KEY is not set (LLM_PROVIDER=openai)");
  } else if (llmProvider === "huggingface" && !huggingfaceApiKey) {
    errors.push("HUGGINGFACE_API_KEY is not set (LLM_PROVIDER=huggingface)");
  }

  // Throw error if any validation failed
  if (errors.length > 0) {
    throw new Error(
      "Configuration errors:\n" + errors.map((e) => `  - ${e}`).join("\n")
    );
  }

  // Return validated configuration
  return {
    neo4j: {
      uri: neo4jUri,
      user: neo4jUser,
      password: neo4jPassword,
    },
    pinecone: {
      apiKey: pineconeApiKey,
      host: pineconeHost,
      indexName: pineconeIndexName,
      vectorDim: pineconeVectorDim,
      topK: pineconeTopK,
    },
    llm: {
      provider: llmProvider,
      openaiApiKey: llmProvider === "openai" ? openaiApiKey : undefined,
      huggingfaceApiKey:
        llmProvider === "huggingface" ? huggingfaceApiKey : undefined,
    },
  };
}

/**
 * Validate configuration without throwing (useful for health checks)
 *
 * @returns Object with validation status and any error messages
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  try {
    getConfig();
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: error instanceof Error ? [error.message] : ["Unknown error"],
    };
  }
}
