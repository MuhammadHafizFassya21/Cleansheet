"use client";

import React from "react";

export default function ManualReviewHeader() {
  return (
    <div>
      <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Manual Review</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Fix or confirm unresolved data quality issues that should not be changed automatically.
      </div>
    </div>
  );
}

