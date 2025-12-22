/**
 * Pinecone Service - Handles vector similarity search
 * This service manages connections to Pinecone and performs semantic search queries
 */

import { Pinecone } from "@pinecone-database/pinecone";
import type { PineconeMetadata } from "./types";
import { getConfig } from "./config";

/**
 * Result from a Pinecone query match
 */
export interface PineconeMatch {
  id: string; // Document ID
  score: number; // Similarity score (0-1)
  metadata: PineconeMetadata; // Document metadata
}

/**
 * PineconeService class for vector database operations
 * Manages connection and queries to Pinecone
 */
class PineconeService {
  private static instance: PineconeService;
  private client: Pinecone | null = null;
  private index: any = null;
  private isInitialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns The singleton PineconeService instance
   */
  public static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService();
    }
    return PineconeService.instance;
  }

  /**
   * Initialize connection to Pinecone
   * Creates client and connects to the specified index
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("Connecting to Pinecone...");
      const config = getConfig();

      // Initialize Pinecone client with API key
      this.client = new Pinecone({
        apiKey: config.pinecone.apiKey,
      });

      // Connect to the specific index
      // The host parameter ensures we connect to the correct serverless instance
      this.index = this.client.index(
        config.pinecone.indexName,
        config.pinecone.host
      );

      // Verify connection by fetching index stats
      await this.index.describeIndexStats();

      this.isInitialized = true;
      console.log("✓ Pinecone connected successfully");
    } catch (error) {
      console.error("Failed to connect to Pinecone:", error);
      throw new Error("Failed to initialize Pinecone");
    }
  }

  /**
   * Query Pinecone for similar vectors
   * Performs semantic search to find documents similar to the query embedding
   *
   * @param embedding - The query embedding vector
   * @param topK - Number of results to return (default: from config)
   * @param filter - Optional metadata filter
   * @returns Array of matching documents with scores
   */
  public async query(
    embedding: number[],
    topK?: number,
    filter?: Record<string, any>
  ): Promise<PineconeMatch[]> {
    if (!this.isInitialized || !this.index) {
      await this.initialize();
    }

    try {
      const config = getConfig();
      const k = topK || config.pinecone.topK;

      // Query the Pinecone index
      const response = await this.index.query({
        vector: embedding, // Query embedding
        topK: k, // Number of results
        includeMetadata: true, // Include document metadata
        includeValues: false, // Don't include vector values (saves bandwidth)
        filter: filter, // Optional metadata filter
      });

      // Transform response into our format
      const matches: PineconeMatch[] = response.matches.map((match: any) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as PineconeMetadata,
      }));

      return matches;
    } catch (error) {
      console.error("Pinecone query error:", error);
      throw new Error("Failed to query Pinecone");
    }
  }

  /**
   * Get index statistics
   * Returns information about the index (vector count, dimension, etc.)
   */
  public async getIndexStats(): Promise<any> {
    if (!this.isInitialized || !this.index) {
      await this.initialize();
    }

    try {
      return await this.index.describeIndexStats();
    } catch (error) {
      console.error("Failed to get index stats:", error);
      throw new Error("Failed to get index statistics");
    }
  }

  /**
   * Check if Pinecone is connected and healthy
   * @returns Boolean indicating health status
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      await this.getIndexStats();
      return true;
    } catch (error) {
      console.error("Pinecone health check failed:", error);
      return false;
    }
  }

  /**
   * Upsert (insert or update) vectors to the index
   * Used for adding new documents to the knowledge base
   *
   * @param vectors - Array of vectors to upsert
   */
  public async upsert(
    vectors: Array<{
      id: string;
      values: number[];
      metadata: PineconeMetadata;
    }>
  ): Promise<void> {
    if (!this.isInitialized || !this.index) {
      await this.initialize();
    }

    try {
      await this.index.upsert(vectors);
      console.log(`✓ Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      console.error("Failed to upsert vectors:", error);
      throw new Error("Failed to upsert vectors to Pinecone");
    }
  }

  /**
   * Delete vectors by ID
   * @param ids - Array of vector IDs to delete
   */
  public async delete(ids: string[]): Promise<void> {
    if (!this.isInitialized || !this.index) {
      await this.initialize();
    }

    try {
      await this.index.deleteMany(ids);
      console.log(`✓ Deleted ${ids.length} vectors from Pinecone`);
    } catch (error) {
      console.error("Failed to delete vectors:", error);
      throw new Error("Failed to delete vectors from Pinecone");
    }
  }
}

// Export singleton instance
export const pineconeService = PineconeService.getInstance();
