"use client";

import React from "react";
import { CleaningPreviewChange } from "@/lib/types";

interface BeforeAfterPreviewTableProps {
  changes: CleaningPreviewChange[];
  totalChanges: number;
}

const actionLabel = (actionId: string) => {
  const map: Record<string, string> = {
    trim_whitespace: "Trim",
    normalize_phone: "Phone",
    remove_duplicates: "Duplicate",
    standardize_missing_values: "Missing",
  };
  return map[actionId] || actionId;
};

export default function BeforeAfterPreviewTable({
  changes,
  totalChanges,
}: BeforeAfterPreviewTableProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Before vs After Preview</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {changes.length} of {totalChanges} changes shown
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-[0.16em] dark:border-slate-800 dark:bg-slate-900">
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Row</th>
              <th className="px-4 py-3">Column</th>
              <th className="px-4 py-3">Original</th>
              <th className="px-4 py-3">Cleaned</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {changes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No changes to preview. Select cleaning actions to see changes.
                </td>
              </tr>
            ) : (
              changes.map((change, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {actionLabel(change.action_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{change.row_index ?? "-"}</td>
                  <td className="px-4 py-3">{change.column || "-"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-slate-500 dark:text-slate-400">
                    {change.original_value || "(empty)"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate font-medium text-emerald-600 dark:text-emerald-400">
                    {change.cleaned_value || "(empty)"}
                  </td>
                  <td className="px-4 py-3 max-w-[280px] truncate">{change.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
