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
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total issues</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{summary.total_review_issues}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fixed</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{summary.fixed_count}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Marked valid</div>
          <div className="text-xl font-bold text-amber-700 dark:text-amber-300">{summary.marked_valid_count}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Remaining</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{summary.remaining_issues_count}</div>
        </div>
      </div>

      {downloadUrl && summary.download_ready && (
        <div className="mt-6 flex justify-center">
          <a
            href={downloadUrl}
            className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Download Final CSV
          </a>
        </div>
      )}
    </div>
  );
}

