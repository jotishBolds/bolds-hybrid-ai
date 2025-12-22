/**
 * Chat Engine - Core logic for the Hybrid AI Travel Assistant
 * Orchestrates embedding generation, vector search, graph queries, and LLM responses
 * This is the main service that coordinates all other services
 */

import { embeddingService } from "./embedding";
import { pineconeService } from "./pinecone";
import { neo4jService } from "./neo4j";
import { llmService } from "./llm";
import { getConfig } from "./config";
import type { ChatResponse, Source, GraphFact } from "./types";
import { randomUUID } from "crypto";

/**
 * ChatEngine class that implements the hybrid RAG (Retrieval-Augmented Generation) pipeline
 * Combines vector search (Pinecone), graph database (Neo4j), and LLM (HuggingFace/OpenAI)
 */
class ChatEngine {
  private static instance: ChatEngine;
  private isInitialized: boolean = false;
  private relevanceThreshold: number = 0.4; // Minimum similarity score to consider relevant

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns The singleton ChatEngine instance
   */
  public static getInstance(): ChatEngine {
    if (!ChatEngine.instance) {
      ChatEngine.instance = new ChatEngine();
    }
    return ChatEngine.instance;
  }

  /**
   * Initialize all services required by the chat engine
   * Must be called before processing any queries
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("Initializing Chat Engine...");

      // Initialize all services in parallel for faster startup
      await Promise.all([
        embeddingService.initialize(),
        pineconeService.initialize(),
        neo4jService.initialize(),
        llmService.initialize(),
      ]);

      this.isInitialized = true;
      console.log("✓ Chat Engine initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Chat Engine:", error);
      throw error;
    }
  }

  /**
   * Process a user query through the hybrid RAG pipeline
   * Steps:
   * 1. Generate embedding for the query
   * 2. Search Pinecone for similar documents
   * 3. Fetch graph context from Neo4j for matched documents
   * 4. Build context from search results and graph facts
   * 5. Summarize context using LLM
   * 6. Generate final answer using LLM with summarized context
   *
   * @param query - User's question
   * @param sessionId - Optional session ID for tracking conversations
   * @returns ChatResponse with answer and sources
   */
  public async processQuery(
    query: string,
    sessionId?: string
  ): Promise<ChatResponse> {
    // Ensure engine is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Validate query
    if (!query || query.trim().length === 0) {
      throw new Error("Query cannot be empty");
    }

    try {
      // Generate session ID if not provided
      const sid = sessionId || randomUUID();

      console.log(`Processing query: "${query}" [session: ${sid}]`);

      // Step 1: Generate embedding for the user query
      console.log("1. Generating query embedding...");
      const queryEmbedding = await embeddingService.embed(query);
      console.log(
        `✓ Generated embedding (${queryEmbedding.length} dimensions)`
      );

      // Step 2: Query Pinecone for similar documents
      console.log("2. Searching Pinecone for similar documents...");
      const config = getConfig();
      const matches = await pineconeService.query(
        queryEmbedding,
        config.pinecone.topK
      );
      console.log(`✓ Found ${matches.length} matches`);

      // Check relevance - if top match is below threshold, we don't have good info
      if (matches.length === 0 || matches[0].score < this.relevanceThreshold) {
        console.log(`⚠ Low relevance score: ${matches[0]?.score || 0}`);
        return {
          response:
            "I'm sorry, but I don't have enough information about that topic to provide a helpful answer. Could you try rephrasing your question or asking about Sikkim Government Service Rules, policies, procedures, or regulations?",
          session_id: sid,
          sources: [],
        };
      }

      // Step 3: Extract sources from matches
      const sources: Source[] = matches.map((match) => ({
        id: match.id,
        name: match.metadata.name,
        type: match.metadata.type,
        city: match.metadata.city,
        score: match.score,
      }));

      // Step 4: Fetch graph context from Neo4j
      console.log("3. Fetching graph context from Neo4j...");
      const nodeIds = matches.map((m) => m.id);
      const graphFacts = await neo4jService.fetchGraphContext(nodeIds, 5);
      console.log(`✓ Retrieved ${graphFacts.length} graph relationships`);

      // Step 5: Build raw context from vector search results
      console.log("4. Building context...");
      let rawContext = this.buildRawContext(matches, graphFacts);
      console.log(`✓ Built context (${rawContext.length} characters)`);

      // Step 6: Summarize the context using LLM
      console.log("5. Summarizing context...");
      const summarizedContext = await llmService.summarize(rawContext);
      console.log(
        `✓ Summarized context (${summarizedContext.length} characters)`
      );

      // Step 7: Generate final answer using LLM
      console.log("6. Generating final answer...");
      const messages = llmService.buildPrompt(query, summarizedContext);
      const answer = await llmService.generateResponse(messages, 0.7, 500);
      console.log(`✓ Generated answer (${answer.length} characters)`);

      // Return the complete response
      return {
        response: answer,
        session_id: sid,
        sources: sources.slice(0, 3), // Return top 3 sources
      };
    } catch (error) {
      console.error("Error processing query:", error);
      throw new Error("Failed to process query");
    }
  }

  /**
   * Build raw context string from Pinecone matches and Neo4j graph facts
   * Creates a structured text that combines document metadata and relationships
   *
   * @param matches - Pinecone search results
   * @param graphFacts - Neo4j relationship data
   * @returns Formatted context string
   */
  private buildRawContext(
    matches: Array<{ id: string; score: number; metadata: any }>,
    graphFacts: GraphFact[]
  ): string {
    let context = "";

    // Add information from top Pinecone matches
    context += "Relevant Places and Information:\n";
    matches.slice(0, 3).forEach((match) => {
      const meta = match.metadata;
      context += `- A ${meta.type} called "${meta.name}" is located in ${meta.city}.`;
      if (meta.description) {
        context += ` ${meta.description}`;
      }
      context += "\n";
    });

    // Add graph relationships if available
    if (graphFacts.length > 0) {
      context += "\nRelationships:\n";
      graphFacts.slice(0, 5).forEach((fact) => {
        context += `- ${fact.source} ${fact.rel} ${fact.target_name}\n`;
      });
    }

    return context;
  }

  /**
   * Perform health check on all services
   * Checks if all components (embedding, Pinecone, Neo4j, LLM) are operational
   *
   * @returns Object with health status for each service
   */
  public async healthCheck(): Promise<{
    status: string;
    services: {
      embedding_model: boolean;
      pinecone: boolean;
      neo4j: boolean;
      llm: boolean;
      llm_provider: string;
    };
  }> {
    try {
      // Check each service in parallel
      const [pineconeHealthy, neo4jHealthy, llmHealthy] = await Promise.all([
        pineconeService.healthCheck(),
        neo4jService.healthCheck(),
        llmService.healthCheck(),
      ]);

      const config = getConfig();

      const services = {
        embedding_model: this.isInitialized, // Embedding runs locally
        pinecone: pineconeHealthy,
        neo4j: neo4jHealthy,
        llm: llmHealthy,
        llm_provider: config.llm.provider,
      };

      // Overall status is healthy if all services are up
      const allHealthy = Object.values(services).every(
        (v) => v === true || typeof v === "string"
      );
      const status = allHealthy ? "healthy" : "degraded";

      return { status, services };
    } catch (error) {
      console.error("Health check error:", error);
      return {
        status: "unhealthy",
        services: {
          embedding_model: false,
          pinecone: false,
          neo4j: false,
          llm: false,
          llm_provider: "unknown",
        },
      };
    }
  }

  /**
   * Cleanup resources
   * Should be called when shutting down the application
   */
  public async cleanup(): Promise<void> {
    await neo4jService.close();
    console.log("✓ Chat Engine cleaned up");
  }
}

// Export singleton instance
export const chatEngine = ChatEngine.getInstance();
