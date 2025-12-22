/**
 * Client-side API utility for communicating with the backend
 * Provides type-safe methods for chat and health check operations
 */

import type { ChatRequest, ChatResponse, HealthCheckResponse } from "./types";

/**
 * Base URL for API requests
 * In production, this will be the same origin
 * In development, it defaults to localhost:3000
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * ChatAPI class provides methods for interacting with the backend API
 */
export class ChatAPI {
  /**
   * Generic request handler with error handling
   * @param endpoint - API endpoint (e.g., '/api/chat')
   * @param options - Fetch options
   * @returns Parsed JSON response
   */
  private static async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      // Parse response body
      const data = await response.json();

      // Check if request was successful
      if (!response.ok) {
        // Extract error message from response
        const errorMessage =
          data.error || data.details || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data as T;
    } catch (error) {
      // Re-throw with additional context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network request failed");
    }
  }

  /**
   * Send a chat message to the assistant
   * @param request - Chat request with message and optional session ID
   * @returns Chat response with answer and sources
   *
   * @example
   * const response = await ChatAPI.sendMessage({
   *   message: 'What are the best hotels in Hanoi?',
   *   session_id: 'my-session'
   * });
   */
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Check the health of backend services
   * @returns Health check response with service statuses
   *
   * @example
   * const health = await ChatAPI.healthCheck();
   * if (health.status === 'healthy') {
   *   console.log('All services operational');
   * }
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>("/api/health");
  }
}
