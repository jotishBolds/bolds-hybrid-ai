/**
 * Chat API Route - POST /api/chat
 *
 * This endpoint handles user messages and returns AI-generated responses
 * using the hybrid RAG (Retrieval-Augmented Generation) pipeline.
 *
 * Flow:
 * 1. Receive user message and optional session ID
 * 2. Process through chat engine (embedding -> vector search -> graph -> LLM)
 * 3. Return assistant response with sources
 *
 * Request body:
 * {
 *   "message": "What are the best hotels in Hanoi?",
 *   "session_id": "optional-session-id"
 * }
 *
 * Response:
 * {
 *   "response": "Here are some great hotels in Hanoi...",
 *   "session_id": "unique-session-id",
 *   "sources": [...]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { chatEngine } from "@/app/lib/chat-engine";
import type { ChatRequest, ChatResponse } from "@/app/lib/types";

/**
 * POST handler for chat messages
 * Processes user queries through the hybrid RAG pipeline
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate message field
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    // Trim and validate message is not empty
    const message = body.message.trim();
    if (message.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Validate message length (prevent abuse)
    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    // Initialize chat engine if needed (only happens once)
    await chatEngine.initialize();

    // Process the query through the hybrid RAG pipeline
    console.log(`Processing chat request: "${message.substring(0, 50)}..."`);
    const response: ChatResponse = await chatEngine.processQuery(
      message,
      body.session_id
    );

    // Return successful response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Log error for debugging
    console.error("Chat API error:", error);

    // Return error response
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns API information
 * Useful for checking if the endpoint is available
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/chat",
    method: "POST",
    description: "Send a message to the AI travel assistant",
    example: {
      request: {
        message: "What are the best places to visit in Hanoi?",
        session_id: "optional-session-id",
      },
      response: {
        response: "AI-generated answer...",
        session_id: "unique-session-id",
        sources: [],
      },
    },
  });
}
