"use client";

import React from "react";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";

export default function DashboardEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-200 mb-6">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">No dataset analyzed yet</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
        Upload a CSV file to detect duplicates, missing values, whitespace problems, strange characters, invalid emails, and invalid Indonesian phone numbers.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          "Duplicate records",
          "Missing values",
          "Extra spaces",
          "Strange characters",
          "Invalid emails",
          "Invalid phone numbers",
        ].map((item) => (
          <div key={item} className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
