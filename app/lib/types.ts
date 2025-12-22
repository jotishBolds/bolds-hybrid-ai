/**
 * Type definitions for the Hybrid AI Travel Assistant
 * Defines interfaces for messages, chat responses, sources, and API requests
 */

/**
 * Message interface representing a single chat message
 */
export interface Message {
  id: string; // Unique identifier for the message
  role: "user" | "assistant"; // Who sent the message
  content: string; // The actual message text
  timestamp: Date; // When the message was created
  sources?: Source[]; // Optional array of source documents (for assistant messages)
}

/**
 * Source interface representing a document/location from the knowledge base
 * These are the places/things retrieved from Pinecone vector search
 */
export interface Source {
  id: string; // Unique identifier from the database
  name: string; // Name of the place/attraction
  type: string; // Type (e.g., "restaurant", "hotel", "attraction")
  city: string; // City where it's located
  score: number; // Similarity score from Pinecone (0-1)
}

/**
 * Chat request sent to the API
 */
export interface ChatRequest {
  message: string; // User's message/question
  session_id?: string; // Optional session ID for conversation continuity
}

/**
 * Chat response received from the API
 */
export interface ChatResponse {
  response: string; // Assistant's response text
  session_id: string; // Session ID for tracking conversation
  sources?: Source[]; // Optional array of source documents used
}

/**
 * Health check response from the API
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"; // Overall health status
  services: {
    embedding_model: boolean; // Is the embedding model loaded?
    llm: boolean; // Is the LLM service available?
    llm_provider: string; // Which LLM provider is being used
    pinecone: boolean; // Is Pinecone connected?
    neo4j: boolean; // Is Neo4j connected?
  };
}

/**
 * Graph fact from Neo4j representing relationships between entities
 */
export interface GraphFact {
  source: string; // Source node ID
  rel: string; // Relationship type
  target_id: string; // Target node ID
  target_name: string; // Target node name
}

/**
 * Metadata stored in Pinecone for each document
 */
export interface PineconeMetadata {
  id: string; // Unique identifier
  name: string; // Name of the place
  type: string; // Type of entity
  city: string; // City location
  description?: string; // Optional description
}
