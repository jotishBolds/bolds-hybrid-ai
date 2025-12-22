/**
 * LLM Service - Handles interaction with Large Language Models
 * Supports both OpenAI and HuggingFace providers for text generation
 */

import { HfInference } from "@huggingface/inference";
import { getConfig } from "./config";

/**
 * Message format for chat completion APIs
 */
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * LLMService class for generating responses using LLMs
 * Supports multiple providers (OpenAI, HuggingFace)
 */
class LLMService {
  private static instance: LLMService;
  private hfClient: HfInference | null = null;
  private provider: "openai" | "huggingface" = "huggingface";
  private isInitialized: boolean = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   * @returns The singleton LLMService instance
   */
  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Initialize the LLM service with the configured provider
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("Initializing LLM service...");
      const config = getConfig();
      this.provider = config.llm.provider;

      if (this.provider === "openai") {
        // OpenAI initialization would go here
        // For now, we'll focus on HuggingFace
        console.log("✓ OpenAI provider configured");
      } else if (this.provider === "huggingface") {
        // Initialize HuggingFace Inference client
        // Note: Package will need to be updated to latest version to support new endpoint
        this.hfClient = new HfInference(config.llm.huggingfaceApiKey);
        console.log("✓ HuggingFace provider configured");
      }

      this.isInitialized = true;
      console.log("✓ LLM service initialized");
    } catch (error) {
      console.error("Failed to initialize LLM service:", error);
      throw new Error("Failed to initialize LLM service");
    }
  }

  /**
   * Generate a chat completion response
   * Takes an array of messages and generates an assistant response
   * Automatically falls back to HuggingFace if OpenAI fails
   *
   * @param messages - Array of conversation messages
   * @param temperature - Sampling temperature (0-1, default: 0.7)
   * @param maxTokens - Maximum tokens to generate (default: 500)
   * @returns Generated response text
   */
  public async generateResponse(
    messages: LLMMessage[],
    temperature: number = 0.7,
    maxTokens: number = 500
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.provider === "huggingface" && this.hfClient) {
        return await this.generateHuggingFaceResponse(
          messages,
          temperature,
          maxTokens
        );
      } else if (this.provider === "openai") {
        try {
          return await this.generateOpenAIResponse(
            messages,
            temperature,
            maxTokens
          );
        } catch (openaiError: any) {
          // If OpenAI fails (rate limit, etc), fallback to HuggingFace
          console.log(
            "⚠ OpenAI failed (rate limit/error), switching to HuggingFace fallback..."
          );

          // Initialize HuggingFace client if needed
          if (!this.hfClient) {
            const config = getConfig();
            this.hfClient = new HfInference(config.llm.huggingfaceApiKey);
            console.log("✓ HuggingFace fallback client initialized");
          }

          return await this.generateHuggingFaceResponse(
            messages,
            temperature,
            maxTokens
          );
        }
      } else {
        throw new Error("No LLM provider configured");
      }
    } catch (error) {
      console.error("LLM generation error:", error);
      throw new Error("Failed to generate LLM response");
    }
  }

  /**
   * Generate response using HuggingFace Inference API
   * Uses Mistral-7B-Instruct-v0.1 model for high-quality responses
   *
   * @param messages - Conversation messages
   * @param temperature - Sampling temperature
   * @param maxTokens - Maximum tokens to generate
   * @returns Generated response text
   */
  private async generateHuggingFaceResponse(
    messages: LLMMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.hfClient) {
      throw new Error("HuggingFace client not initialized");
    }

    try {
      // Use chat completion with Qwen model (better support in new HF SDK)
      // Qwen is supported by the router and provides similar quality to Mistral
      const response = await this.hfClient.chatCompletion({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: messages as any,
        temperature: temperature,
        max_tokens: maxTokens,
      });

      // Extract the generated text from the response
      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content || "";
      } else {
        throw new Error("No response generated");
      }
    } catch (error: any) {
      console.error("HuggingFace API error:", error);

      // Log detailed error information for debugging
      if (error.httpResponse) {
        console.error("HTTP Status:", error.httpResponse.status);
        console.error("HTTP Response:", error.httpResponse);
      }

      // Both providers failed - return helpful message
      return "I apologize, but the AI service encountered an error. The system is experiencing technical difficulties. Please try again in a moment.";
    }
  }

  /**
   * Generate response using OpenAI API
   * Uses GPT-3.5-turbo for cost-effective responses
   *
   * @param messages - Conversation messages
   * @param temperature - Sampling temperature
   * @param maxTokens - Maximum tokens to generate
   * @returns Generated response text
   */
  private async generateOpenAIResponse(
    messages: LLMMessage[],
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    // OpenAI implementation
    // Would use the OpenAI SDK here
    const config = getConfig();

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.llm.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: temperature,
            max_tokens: maxTokens,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "I apologize, but I'm experiencing technical difficulties. Please try again.";
    }
  }

  /**
   * Summarize a block of context text
   * Uses the LLM to create a concise summary focusing on key entities and relationships
   *
   * @param context - The text to summarize
   * @returns Summarized text
   */
  public async summarize(context: string): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content:
          "You are a text summarization assistant. Summarize the following context into a concise paragraph, focusing on key entities and their relationships.",
      },
      {
        role: "user",
        content: context,
      },
    ];

    return await this.generateResponse(messages, 0.5, 300);
  }

  /**
   * Build a prompt for answering a question based on context
   * Creates a structured prompt that instructs the LLM to answer based only on provided context
   *
   * @param query - User's question
   * @param context - Relevant context information
   * @returns Array of messages for LLM
   */
  public buildPrompt(query: string, context: string): LLMMessage[] {
    return [
      {
        role: "system",
        content:
          "You are a helpful assistant for Sikkim Government Service Rules. Answer the user's question based ONLY on the summarized context provided. Be concise and helpful. If the context doesn't contain enough information, say so.",
      },
      {
        role: "user",
        content: `Summarized Context:\n${context}\n\nQuestion: ${query}`,
      },
    ];
  }

  /**
   * Check if LLM service is healthy
   * @returns Boolean indicating health status
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      return this.isInitialized;
    } catch (error) {
      console.error("LLM health check failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
