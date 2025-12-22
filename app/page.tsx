/**
 * Home Page Component
 *
 * Main landing page with clean design
 */

"use client";

import { FloatingChatBubble } from "./components/FloatingChatBubble";

/**
 * Home page component
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      {/* Centered Text */}
      <div className="text-center px-4">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-thin text-foreground">
          Hi. Bolds Innovation
        </h1>
      </div>

      {/* Floating Chat Bubble - positioned at bottom center */}
      <FloatingChatBubble />
    </main>
  );
}
