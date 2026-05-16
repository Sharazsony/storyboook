import React from "react";
import { Badge } from "@/components/ui/badge";

const EVENT_TYPE_COLORS: Record<string, string> = {
  quiz: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  exam: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  viva: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  assignment: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  presentation: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  other: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
};

export function EventTypeBadge({ type }: { type: string }) {
  const normalizedType = type.toLowerCase();
  const colorClass = EVENT_TYPE_COLORS[normalizedType] || EVENT_TYPE_COLORS.other;

  return (
    <Badge variant="outline" className={`capitalize font-medium ${colorClass}`}>
      {type}
    </Badge>
  );
}
