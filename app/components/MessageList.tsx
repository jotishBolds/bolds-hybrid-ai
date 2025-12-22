/**
 * MessageList Component
 *
 * Displays the conversation history with user and assistant messages
 * Features:
 * - Scrollable message container
 * - User vs Assistant message styling
 * - Timestamps
 * - Source documents for assistant messages
 * - Auto-scroll to newest messages
 * - Loading indicator
 */

"use client";

import { useEffect, useRef } from "react";
import { User, Bot, Loader2 } from "lucide-react";
import type { Message } from "@/app/lib/types";
import { SourceList } from "./SourceList";
import { formatMessageTime, cn } from "@/app/lib/utils";

interface MessageListProps {
  /** Array of messages in the conversation */
  messages: Message[];
  /** Whether a message is currently being processed */
  isLoading?: boolean;
}

/**
 * MessageList component displays the conversation
 */
export function MessageList({ messages, isLoading = false }: MessageListProps) {
  // Reference to the scroll container for auto-scrolling
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-background"
      style={{ maxHeight: "calc(100vh - 200px)" }}
    >
      {/* Welcome message if no messages yet */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <Bot className="h-16 w-16 text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Sikkim Government Service Assistant
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Ask me anything about Sikkim Government Service Rules, policies,
            procedures, regulations, and more. I'm here to help you understand
            government services!
          </p>
        </div>
      )}

      {/* Render each message */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {/* Avatar (shown on left for assistant, right for user) */}
          {message.role === "assistant" && (
            <div className="shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          )}

          {/* Message content */}
          <div
            className={cn(
              "max-w-[80%] rounded-lg px-4 py-2",
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {/* Message text */}
            <div className="text-sm whitespace-pre-wrap wrap-break-word">
              {message.content}
            </div>

            {/* Timestamp */}
            <div
              className={cn(
                "text-xs mt-1",
                message.role === "user" ? "opacity-80" : "text-muted-foreground"
              )}
            >
              {formatMessageTime(message.timestamp)}
            </div>

            {/* Sources (only for assistant messages) */}
            {message.role === "assistant" && message.sources && (
              <SourceList sources={message.sources} />
            )}
          </div>

          {/* User avatar */}
          {message.role === "user" && (
            <div className="shrink-0">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="bg-muted rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
