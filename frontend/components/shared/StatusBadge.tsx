"use client";

import React from "react";
import { BackendHealth } from "@/lib/types";

interface StatusBadgeProps {
  health: BackendHealth | null;
  loading: boolean;
  error: boolean;
  apiBaseUrl?: string;
}

export default function StatusBadge({ health, loading, error, apiBaseUrl }: StatusBadgeProps) {
  const title = apiBaseUrl ? `API: ${apiBaseUrl}` : "API Status";

  if (loading) {
    return (
      <div
        title={title}
        className="fixed right-4 top-20 z-[60] sm:right-6"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
        </span>
      </div>
    );
  }

  if (error || !health || health.status !== "ok") {
    return (
      <div
        title={title}
        className="fixed right-4 top-20 z-[60] sm:right-6"
      >
        <span className="relative flex h-3 w-3">
          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
        </span>
      </div>
    );
  }

  return (
    <div
      title={title}
      className="fixed right-4 top-20 z-[60] sm:right-6"
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>
    </div>
  );
}
