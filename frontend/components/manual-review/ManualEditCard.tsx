"use client";

import React from "react";
import { ManualReviewIssue, ManualValidationResult } from "@/lib/types";

export default function ManualEditCard({
  issue,
  value,
  validatedResult,
  validateLoading,
  markedValid,
  onValueChange,
  onValidate,
  onMarkValid,
}: {
  issue: ManualReviewIssue;
  value: string;
  validatedResult: ManualValidationResult | null;
  validateLoading: boolean;
  markedValid: boolean;
  onValueChange: (v: string) => void;
  onValidate: () => void;
  onMarkValid: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{issue.type}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Severity: {issue.severity} • Row: {issue.row_index} • Column: {issue.column}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Status: {markedValid ? "marked_valid" : "pending"}
          </div>
        </div>

        <div className="text-sm text-slate-700 dark:text-slate-200">
          <div className="font-semibold">Message</div>
          <div>{issue.message}</div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Recommendation: {issue.recommendation}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-900 dark:text-white">Current value</label>
          <input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onValidate}
              disabled={validateLoading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {validateLoading ? "Validating…" : "Validate"}
            </button>

            <button
              type="button"
              onClick={onMarkValid}
              disabled={markedValid}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              Mark as Valid
            </button>
          </div>

          {validatedResult && (
            <div
              className={`text-sm ${
                validatedResult.is_valid
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {validatedResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

