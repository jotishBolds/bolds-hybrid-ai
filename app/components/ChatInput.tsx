/**
 * ChatInput Component
 *
 * Provides a text input field with a send button for users to submit messages
 * Features:
 * - Auto-expanding textarea
 * - Send button with loading state
 * - Enter key to send (Shift+Enter for new line)
 * - Character limit display
 * - Disabled state while loading
 */

"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ChatInputProps {
  /** Callback function when user sends a message */
  onSendMessage: (message: string) => void;
  /** Whether the chat is currently processing a message */
  isLoading?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Maximum character limit */
  maxLength?: number;
}

/**
 * ChatInput component for message composition
 */
export function ChatInput({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask about Sikkim Government Service Rules...",
  maxLength = 1000,
}: ChatInputProps) {
  // Local state for the current message text
  const [message, setMessage] = useState("");

  /**
   * Handle sending the message
   * Validates message is not empty and calls the callback
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();

    // Don't send empty messages
    if (!trimmedMessage || isLoading) {
      return;
    }

    // Call the parent callback
    onSendMessage(trimmedMessage);

    // Clear the input
    setMessage("");
  };

  /**
   * Handle keyboard events
   * Enter key sends the message (unless Shift is held)
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Calculate remaining characters
  const remaining = maxLength - message.length;
  const isNearLimit = remaining < 50;

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex gap-2">
        {/* Message input textarea */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg border border-input bg-background px-4 py-3",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "disabled:bg-muted disabled:cursor-not-allowed",
              "text-sm transition-colors",
              "leading-relaxed"
            )}
            style={{
              minHeight: "48px",
              maxHeight: "120px",
            }}
          />

          {/* Character count (shown when near limit) */}
          {isNearLimit && (
            <div
              className={cn(
                "absolute bottom-2 right-2 text-xs",
                remaining < 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {remaining}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className={cn(
            "rounded-lg px-4 py-3 font-medium transition-all",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
            "hover:shadow-md active:scale-95",
            "h-12 min-w-12"
          )}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-muted-foreground">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
