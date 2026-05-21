"use client";

import React from "react";

export default function CleaningHeader() {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-600">Cleaning Recommendations</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Review and preview safe cleaning actions.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
          Review safe cleaning actions and preview changes before modifying your dataset. Select actions to see before-after previews of what will change.
        </p>
      </div>
    </div>
  );
}
