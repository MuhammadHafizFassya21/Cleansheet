"use client";

import React from "react";

export default function ManualReviewNotice() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Manual Review Required
      </div>
      <div className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
        CleanSheet AI does not guess invalid emails, invalid phone numbers, or suspicious negative values. Please edit or confirm them manually.
      </div>
    </div>
  );
}

