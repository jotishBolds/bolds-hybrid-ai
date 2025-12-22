/**
 * SourceList Component
 *
 * Displays a list of source documents used to generate the AI response
 * Shows relevant places/attractions from the knowledge base with their
 * similarity scores and details
 */

"use client";

import { MapPin, Building2, Coffee, Hotel } from "lucide-react";
import type { Source } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

interface SourceListProps {
  /** Array of source documents to display */
  sources: Source[];
}

/**
 * Get an icon component based on the source type
 * @param type - Type of place (hotel, restaurant, attraction, etc.)
 * @returns Lucide icon component
 */
function getSourceIcon(type: string) {
  const typeNormalized = type.toLowerCase();

  if (
    typeNormalized.includes("hotel") ||
    typeNormalized.includes("accommodation")
  ) {
    return Hotel;
  }
  if (
    typeNormalized.includes("restaurant") ||
    typeNormalized.includes("cafe") ||
    typeNormalized.includes("food")
  ) {
    return Coffee;
  }
  if (
    typeNormalized.includes("building") ||
    typeNormalized.includes("museum")
  ) {
    return Building2;
  }

  // Default icon
  return MapPin;
}

/**
 * SourceList component displays source documents
 */
export function SourceList({ sources }: SourceListProps) {
  // Don't render anything if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Header */}
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Sources ({sources.length})
      </div>

      {/* Source cards */}
      <div className="space-y-2">
        {sources.map((source, index) => {
          // Get appropriate icon for this source type
          const Icon = getSourceIcon(source.type);

          // Convert similarity score to percentage
          const scorePercent = Math.round(source.score * 100);

          // Determine color based on score
          const scoreColor =
            scorePercent >= 80
              ? "text-green-600 dark:text-green-500"
              : scorePercent >= 60
              ? "text-yellow-600 dark:text-yellow-500"
              : "text-muted-foreground";

          return (
            <div
              key={source.id || index}
              className={cn(
                "flex items-start gap-3 rounded-lg border border-border p-3",
                "bg-card hover:bg-accent transition-colors"
              )}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and type */}
                <div className="font-medium text-sm text-foreground">
                  {source.name}
                </div>

                {/* Location and type */}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{source.type}</span>
                  {source.city && (
                    <>
                      <span>•</span>
                      <span>{source.city}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Similarity score */}
              <div className={cn("text-xs font-medium shrink-0", scoreColor)}>
                {scorePercent}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
