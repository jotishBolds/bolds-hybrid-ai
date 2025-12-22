/**
 * HuggingFace Embedding Service - Production-ready text-to-vector conversion
 * This service uses HuggingFace Inference API with the BAAI/bge-large-en-v1.5 model
 * Compatible with Vercel and other serverless environments
 */

import { HfInference } from "@huggingface/inference";

/**
 * HuggingFace Embedding Service class
 * Implements singleton pattern for efficient API usage
 */
class HuggingFaceEmbeddingService {
  private static instance: HuggingFaceEmbeddingService;
  private hf: HfInference | null = null;
  private cache: Map<string, number[]> = new Map();
  private isInitialized: boolean = false;

  // Model configuration
  private readonly modelId = "BAAI/bge-large-en-v1.5";
  private readonly maxCacheSize = 100;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   * @returns The singleton HuggingFaceEmbeddingService instance
   */
  public static getInstance(): HuggingFaceEmbeddingService {
    if (!HuggingFaceEmbeddingService.instance) {
      HuggingFaceEmbeddingService.instance = new HuggingFaceEmbeddingService();
    }
    return HuggingFaceEmbeddingService.instance;
  }

  /**
   * Initialize the HuggingFace client
   * Must be called before using the service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "HUGGINGFACE_API_KEY not found in environment variables"
      );
    }

    try {
      this.hf = new HfInference(apiKey);
      this.isInitialized = true;
      console.log("✓ HuggingFace Embedding Service initialized");
    } catch (error) {
      console.error("Failed to initialize HuggingFace client:", error);
      throw new Error("Failed to initialize HuggingFace embedding service");
    }
  }

  /**
   * Generate an embedding vector for the given text
   * Uses caching to avoid redundant API calls
   *
   * @param text - The input text to embed
   * @returns Promise<number[]> - The embedding vector (1024 dimensions)
   */
  public async embed(text: string): Promise<number[]> {
    // Check cache first
    if (this.cache.has(text)) {
      console.log(`Cache hit for text: "${text.substring(0, 50)}..."`);
      return this.cache.get(text)!;
    }

    // Ensure service is initialized
    if (!this.isInitialized || !this.hf) {
      await this.initialize();
    }

    if (!this.hf) {
      throw new Error("HuggingFace client not initialized");
    }

    try {
      console.log(`Generating embedding for: "${text.substring(0, 50)}..."`);
      
      // Call HuggingFace Inference API for feature extraction
      const response = await this.hf.featureExtraction({
        model: this.modelId,
        inputs: text,
      });

      // Convert response to number array
      let embedding: number[];
      
      if (Array.isArray(response)) {
        // If response is already a flat array
        if (typeof response[0] === 'number') {
          embedding = response as number[];
        } else {
          // If response is nested array (batch), take the first element
          embedding = (response as number[][])[0];
        }
      } else {
        throw new Error("Unexpected response format from HuggingFace API");
      }

      // Validate embedding dimensions
      if (embedding.length !== 1024) {
        throw new Error(
          `Expected 1024 dimensions, got ${embedding.length} dimensions`
        );
      }

      // Cache the result
      this.cache.set(text, embedding);

      // Manage cache size
      this.manageCacheSize();

      console.log(`✓ Generated ${embedding.length}D embedding`);
      return embedding;
    } catch (error) {
      console.error("Error generating embedding via HuggingFace:", error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          throw new Error("HuggingFace API authentication failed. Check your HUGGINGFACE_API_KEY.");
        } else if (error.message.includes("429")) {
          throw new Error("HuggingFace API rate limit exceeded. Please try again later.");
        } else if (error.message.includes("model")) {
          throw new Error(`HuggingFace model ${this.modelId} not available or loading.`);
        }
      }
      
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch embed multiple texts efficiently
   * Processes texts individually but with optimized caching
   * 
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  public async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    console.log(`Processing batch of ${texts.length} texts`);
    
    // Process each text (HF Inference API is more efficient with individual calls)
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      try {
        const embedding = await this.embed(text);
        embeddings.push(embedding);
        
        // Add small delay to avoid overwhelming the API
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to embed text ${i + 1}/${texts.length}:`, error);
        throw error;
      }
    }

    console.log(`✓ Successfully processed batch of ${embeddings.length} embeddings`);
    return embeddings;
  }

  /**
   * Manage cache size to prevent memory issues
   * Removes oldest entries when cache exceeds limit
   */
  private manageCacheSize(): void {
    while (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear the embedding cache
   * Useful for freeing memory
   */
  public clearCache(): void {
    this.cache.clear();
    console.log("Embedding cache cleared");
  }

  /**
   * Get cache statistics
   * @returns Object with cache information
   */
  public getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Test the service with a simple embedding generation
   * Useful for health checks
   */
  public async testService(): Promise<boolean> {
    try {
      await this.initialize();
      const testEmbedding = await this.embed("test");
      return testEmbedding.length === 1024;
    } catch (error) {
      console.error("Embedding service test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const embeddingService = HuggingFaceEmbeddingService.getInstance();