"use client";

import React from "react";
import { BackendHealth } from "@/lib/types";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  health: BackendHealth | null;
  loading: boolean;
  error: boolean;
  apiBaseUrl?: string;
}

export default function StatusBadge({ health, loading, error, apiBaseUrl }: StatusBadgeProps) {
  const positionClasses = "fixed right-4 top-20 z-[60] sm:right-6";

  if (loading) {
    return (
      <div
        title={apiBaseUrl ? `Configured API URL: ${apiBaseUrl}` : undefined}
        className={`${positionClasses} flex items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur dark:border-amber-900/50 dark:bg-slate-950/90 dark:text-amber-300`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Memeriksa API</span>
      </div>
    );
  }

  if (error || !health || health.status !== "ok") {
    return (
      <div
        title={apiBaseUrl ? `Configured API URL: ${apiBaseUrl}` : undefined}
        className={`${positionClasses} flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-rose-200 bg-white/95 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm backdrop-blur dark:border-rose-900/50 dark:bg-slate-950/90 dark:text-rose-300`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.16)]" />
        <AlertCircle className="h-3.5 w-3.5" />
        <span className="truncate">API Offline</span>
      </div>
    );
  }

  return (
    <div
      title={apiBaseUrl ? `Configured API URL: ${apiBaseUrl}` : undefined}
      className={`${positionClasses} flex items-center gap-2 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur dark:border-emerald-900/50 dark:bg-slate-950/90 dark:text-emerald-300`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]" />
      </span>
      <CheckCircle className="h-3.5 w-3.5" />
      <span>API Terhubung</span>
    </div>
  );
}
