"use client";

import React from "react";

export default function ManualReviewEmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        No manual review issues found
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Your dataset does not contain unresolved issues that require manual editing.
      </p>
    </div>
  );
}

