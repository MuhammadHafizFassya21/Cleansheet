"use client";

import React from "react";

export default function DashboardHeader() {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-emerald-600">Data Quality Dashboard</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Understand your CSV quality in one clean view.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            Upload a CSV file to detect hidden data quality issues and understand your dataset readiness. CleanSheet shows score, issue summary, top problem columns, and a filterable issue table.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-slate-200/90 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />
          Rule-based analysis
        </div>
      </div>
    </div>
  );
}
