"use client";

import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { CleaningApplyResponse } from "@/lib/types";

interface CleaningSummaryCardProps {
  summary: CleaningApplyResponse;
}

export default function CleaningSummaryCard({ summary }: CleaningSummaryCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Cleaning completed
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.cleaned_file_name}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Original rows
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.original_row_count}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Cleaned rows
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.cleaned_row_count}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Rows removed
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.rows_removed}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Cells modified
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.cells_modified}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          Actions applied:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.actions_applied.map((actionId) => (
            <span
              key={actionId}
              className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700"
            >
              {actionId}
            </span>
          ))}
          {summary.actions_applied.length === 0 && (
            <span className="text-xs text-slate-500">-</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Download ready:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {summary.download_ready ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Download className="h-4 w-4" />
          <span className="font-semibold text-slate-900 dark:text-white">
            {summary.download_ready ? "Available" : "Apply to enable"}
          </span>
        </div>
      </div>
    </div>
  );
}
