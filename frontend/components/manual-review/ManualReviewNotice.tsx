"use client";

import React from "react";

export default function ManualReviewNotice() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        Safety Notice
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        CleanSheet AI does not guess invalid emails, invalid phone numbers, or suspicious negative values. Please edit or confirm them manually.
      </p>
    </div>
  );
}

