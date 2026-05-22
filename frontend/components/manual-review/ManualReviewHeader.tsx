"use client";

import React from "react";

export default function ManualReviewHeader() {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
        Manual Review
      </h1>
      <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
        Fix or confirm unresolved data quality issues that should not be changed automatically.
      </p>
    </div>
  );
}

