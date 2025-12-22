/**
 * Embedding Service - Handles text-to-vector conversion using HuggingFace Transformers
 * This service uses the BAAI/bge-large-en-v1.5 model to generate 1024-dimensional embeddings
 * Runs in-browser using WebAssembly for efficient client-side processing
 */

import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

/**
 * EmbeddingService class that manages the embedding model lifecycle
 * Implements singleton pattern to avoid loading the model multiple times
 */
class EmbeddingService {
  private static instance: EmbeddingService;
  private pipeline: FeatureExtractionPipeline | null = null;
  private cache: Map<string, number[]> = new Map(); // Cache for previously computed embeddings
  private isInitializing: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of EmbeddingService
   * @returns The singleton EmbeddingService instance
   */
  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Initialize the embedding model
   * This is an async operation that downloads and loads the model
   * Subsequent calls will wait for the first initialization to complete
   */
  public async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.pipeline) {
      return;
    }

    // If currently initializing, wait for that to complete
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.isInitializing = true;
    this.initPromise = this._doInitialize();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  /**
   * Internal method to perform the actual initialization
   * Downloads and loads the BAAI/bge-large-en-v1.5 model
   */
  private async _doInitialize(): Promise<void> {
    try {
      console.log("Loading embedding model: BAAI/bge-large-en-v1.5...");

      // Create a feature extraction pipeline with the BGE model
      // This model produces 1024-dimensional embeddings
      this.pipeline = await pipeline(
        "feature-extraction",
        "Xenova/bge-large-en-v1.5"
      );

      console.log("✓ Embedding model loaded successfully");
    } catch (error) {
      console.error("Failed to load embedding model:", error);
      throw new Error("Failed to initialize embedding model");
    }
  }

  /**
   * Generate an embedding vector for the given text
   * Uses caching to avoid recomputing embeddings for the same text
   *
   * @param text - The input text to embed
   * @returns Promise<number[]> - The embedding vector (1024 dimensions)
   */
  public async embed(text: string): Promise<number[]> {
    // Check cache first
    if (this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    // Ensure model is initialized
    if (!this.pipeline) {
      await this.initialize();
    }

    if (!this.pipeline) {
      throw new Error("Embedding model not initialized");
    }

    try {
      // Generate embedding using the pipeline
      // The model outputs a tensor, we need to extract the array
      const output = await this.pipeline(text, {
        pooling: "mean", // Use mean pooling for sentence embeddings
        normalize: true, // Normalize the output vector
      });

      // Convert tensor to array
      const embedding = Array.from(output.data) as number[];

      // Cache the result
      this.cache.set(text, embedding);

      // Limit cache size to prevent memory issues
      if (this.cache.size > 100) {
        // Remove oldest entry
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }

      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  /**
   * Batch embed multiple texts efficiently
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  public async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Clear the embedding cache
   * Useful for freeing memory when needed
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Object with cache size information
   */
  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 100,
    };
  }
}

// Export singleton instance
export const embeddingService = EmbeddingService.getInstance();
