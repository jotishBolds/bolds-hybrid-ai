/**
 * FloatingChatBubble Component
 *
 * A professional floating chat widget positioned at bottom center
 * Features:
 * - Capsule design with smooth animations
 * - Expanded state (full chat interface)
 * - Click outside to close
 * - Mobile responsive
 * - Uses shadcn/ui theme colors
 * - Lucide icons only
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatBot } from "./ChatBot";
import { cn } from "@/app/lib/utils";

/**
 * FloatingChatBubble component - displays a floating chat widget
 */
export function FloatingChatBubble() {
  // State for expanded/minimized
  const [isExpanded, setIsExpanded] = useState(false);

  // Reference to the chat container for click-outside detection
  const chatRef = useRef<HTMLDivElement>(null);

  /**
   * Handle clicking outside the chat to close it
   */
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    // Add event listener after a short delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  /**
   * Toggle expanded state
   */
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div ref={chatRef}>
      {/* Expanded chat window */}
      {isExpanded && (
        <div
          className={cn(
            "fixed z-50 bottom-24 left-1/2 -translate-x-1/2",
            "w-[95vw] max-w-[420px] lg:max-w-[500px] h-[600px] max-h-[80vh]",
            "rounded-2xl shadow-2xl border border-border bg-card",
            "animate-in slide-in-from-bottom-8 fade-in duration-300"
          )}
        >
          {/* Chat interface */}
          <div className="h-full rounded-2xl overflow-hidden">
            <ChatBot />
          </div>
        </div>
      )}

      {/* Floating capsule button - shows different content when expanded/collapsed */}
      <button
        onClick={toggleExpanded}
        className={cn(
          "fixed z-50 bottom-6 left-1/2 -translate-x-1/2",
          "px-6 py-3 rounded-full",
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
          "shadow-lg border border-border",
          "transition-all duration-300",
          "hover:scale-105 hover:shadow-xl active:scale-95",
          "flex items-center gap-2"
        )}
        aria-label={isExpanded ? "Close chat" : "Open chat"}
      >
        {isExpanded ? (
          <>
            <X className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">Close</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium hidden sm:inline">
              Ask me anything
            </span>
            <span className="text-sm font-medium sm:hidden">Chat</span>
          </>
        )}
      </button>
    </div>
  );
}
