"use client";

import React from "react";

export default function CleaningEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200 mb-6">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">No dataset selected yet</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
        Upload a CSV file to get cleaning recommendations based on detected data quality issues.
      </p>
    </div>
  );
}
