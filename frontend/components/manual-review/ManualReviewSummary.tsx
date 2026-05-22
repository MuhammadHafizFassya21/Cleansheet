"use client";

import React from "react";
import { ManualReviewApplyResponse } from "@/lib/types";

export default function ManualReviewSummary({
  summary,
  downloadUrl,
}: {
  summary: ManualReviewApplyResponse;
  downloadUrl: string | null;
}) {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-base font-bold text-slate-900 dark:text-white">Review Summary</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Total issues: <span className="font-semibold">{summary.total_review_issues}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fixed</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{summary.fixed_count}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Marked valid</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{summary.marked_valid_count}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Remaining</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{summary.remaining_issues_count}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <a
            href={downloadUrl ?? undefined}
            download={"manual_cleaned.csv"}
            className={`inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${
              !downloadUrl ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Unduh CSV Hasil Manual
          </a>
        </div>
      </div>
    </div>
  );
}

