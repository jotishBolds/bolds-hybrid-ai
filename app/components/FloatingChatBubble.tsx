/**
 * FloatingChatBubble Component
 *
 * A professional floating chat widget that starts full-screen and can minimize to a bubble
 * Features:
 * - Full-screen chat interface initially
 * - Minimize to capsule design with smooth animations
 * - Click bubble to expand back to full-screen
 * - Mobile responsive
 * - Uses shadcn/ui theme colors
 * - Lucide icons only
 */

"use client";

import { useState, useRef } from "react";
import { MessageCircle, Minimize2 } from "lucide-react";
import { ChatBot } from "./ChatBot";
import { cn } from "@/app/lib/utils";

/**
 * FloatingChatBubble component - displays a full-screen chat that can minimize to a bubble
 */
export function FloatingChatBubble() {
  // State for expanded/minimized - starts expanded (full-screen)
  const [isExpanded, setIsExpanded] = useState(true);

  // Reference to the chat container (no longer needed for click-outside since it's full-screen)
  const chatRef = useRef<HTMLDivElement>(null);

  /**
   * Toggle expanded state
   */
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div ref={chatRef}>
      {/* Full-screen chat window */}
      {isExpanded && (
        <div
          className={cn(
            "fixed z-50 inset-0",
            "bg-background",
            "animate-in fade-in duration-300"
          )}
        >
          {/* Chat interface */}
          <div className="h-full overflow-hidden">
            <ChatBot onMinimize={() => setIsExpanded(false)} />
          </div>
        </div>
      )}

      {/* Floating capsule button - shows when minimized */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
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
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-medium hidden sm:inline">
            Ask me anything
          </span>
          <span className="text-sm font-medium sm:hidden">Chat</span>
        </button>
      )}
    </div>
  );
}
