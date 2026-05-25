"use client";

import React from "react";
import { BackendHealth } from "@/lib/types";
import { Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface StatusBadgeProps {
  health: BackendHealth | null;
  loading: boolean;
  error: boolean;
}

export default function StatusBadge({ health, loading, error }: StatusBadgeProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium w-fit">
        <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
        <span>Memeriksa koneksi API...</span>
      </div>
    );
  }

  if (error || !health || health.status !== "ok") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-medium w-fit">
        <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />
        <span>API Offline — jalankan backend di port 8000</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 text-xs font-medium w-fit shadow-xs">
      <CheckCircle className="h-3 w-3 text-emerald-500" />
      <span className="flex items-center gap-1.5">
        API Terhubung
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </span>
    </div>
  );
}
