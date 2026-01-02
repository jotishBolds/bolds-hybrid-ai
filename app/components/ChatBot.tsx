/**
 * ChatBot Component
 *
 * Main chat interface component that combines:
 * - Message list display
 * - Message input
 * - Connection status
 * - Error handling
 * - Minimize functionality
 *
 * This component manages the chat state and communication with the API
 */

"use client";

import { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ChatAPI } from "@/app/lib/api";
import type { Message } from "@/app/lib/types";
import { AlertCircle, Wifi, WifiOff, Minimize2, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

/**
 * ChatBot component - main chat interface
 */
export function ChatBot({ onMinimize }: { onMinimize?: () => void }) {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  /**
   * Check backend connection on component mount
   */
  useEffect(() => {
    checkConnection();
  }, []);

  /**
   * Perform health check to verify backend is accessible
   */
  const checkConnection = async () => {
    try {
      await ChatAPI.healthCheck();
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      console.error("Health check failed:", error);
    }
  };

  /**
   * Handle sending a new message
   * @param content - The message text to send
   */
  const handleSendMessage = async (content: string) => {
    // Clear any previous errors
    setError(null);

    // Create and add user message immediately for instant feedback
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Set loading state
    setIsLoading(true);

    try {
      // Send message to API
      const response = await ChatAPI.sendMessage({
        message: content,
        session_id: sessionId || undefined,
      });

      // Update session ID if provided
      if (response.session_id) {
        setSessionId(response.session_id);
      }

      // Create and add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Mark as connected
      setIsConnected(true);
    } catch (err) {
      console.error("Error sending message:", err);

      // Set error message
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to send message. Please check your connection.";
      setError(errorMessage);

      // Mark as disconnected
      setIsConnected(false);
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  };

  /**
   * Dismiss error message
   */
  const dismissError = () => {
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header with title, connection status, and minimize button */}
      <div className="bg-primary text-primary-foreground p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Sikkim Govt. Service Rules Assistant
            </h2>
            <p className="text-sm opacity-90">Powered by Bolds Innovation</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection status indicator */}
            {isConnected !== null && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                  isConnected
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            )}

            {/* Minimize button */}
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-2 rounded-md hover:bg-primary-foreground/10 transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error message banner */}
      {error && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <button
              onClick={dismissError}
              className="text-destructive hover:text-destructive/80 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder="Ask."
      />
    </div>
  );
}
