"use client";

import React from "react";

export default function ManualReviewEmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="text-base font-bold text-slate-900 dark:text-white">No manual review issues found</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        No manual review issues found. Your dataset does not contain unresolved issues that require manual editing.
      </div>
    </div>
  );
}

