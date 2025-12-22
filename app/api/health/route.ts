/**
 * Health Check API Route - GET /api/health
 *
 * This endpoint checks the health of all services:
 * - Embedding model (local)
 * - Pinecone (vector database)
 * - Neo4j (graph database)
 * - LLM service (HuggingFace or OpenAI)
 *
 * Returns:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "services": {
 *     "embedding_model": true/false,
 *     "pinecone": true/false,
 *     "neo4j": true/false,
 *     "llm": true/false,
 *     "llm_provider": "huggingface" | "openai"
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { chatEngine } from "@/app/lib/chat-engine";
import { validateConfig } from "@/app/lib/config";

/**
 * GET handler for health check
 * Initializes services if needed and checks their status
 */
export async function GET(request: NextRequest) {
  try {
    // First, validate configuration
    const configValidation = validateConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Configuration invalid",
          details: configValidation.errors,
        },
        { status: 503 }
      );
    }

    // Initialize chat engine (if not already initialized)
    try {
      await chatEngine.initialize();
    } catch (initError) {
      console.error("Failed to initialize chat engine:", initError);
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Failed to initialize services",
          details:
            initError instanceof Error ? initError.message : "Unknown error",
        },
        { status: 503 }
      );
    }

    // Perform health check on all services
    const healthStatus = await chatEngine.healthCheck();

    // Determine HTTP status code based on health
    const httpStatus = healthStatus.status === "healthy" ? 200 : 503;

    // Return health status
    return NextResponse.json(healthStatus, { status: httpStatus });
  } catch (error) {
    console.error("Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
