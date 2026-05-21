"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function CleaningLoadingState() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300 mb-6">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Menyiapkan rekomendasi pembersihan…
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
        Menganalisis dataset dan menyusun aksi pembersihan yang aman.
      </p>
    </div>
  );
}
