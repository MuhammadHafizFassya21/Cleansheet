"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { CleaningApplyResponse } from "@/lib/types";
import QualityGateBanner from "@/components/shared/QualityGateBanner";

interface CleaningSummaryCardProps {
  summary: CleaningApplyResponse;
}

const actionLabel = (actionId: string) => {
  const map: Record<string, string> = {
    trim_whitespace: "Trim whitespace",
    normalize_phone: "Normalisasi telepon",
    remove_duplicates: "Hapus duplikat",
    standardize_missing_values: "Standarkan missing value",
    remove_strange_characters: "Hapus karakter aneh",
  };
  return map[actionId] || actionId;
};

export default function CleaningSummaryCard({ summary }: CleaningSummaryCardProps) {
  const gatePassed = summary.quality_gate_passed ?? summary.download_ready;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm max-w-2xl w-full">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Pembersihan selesai</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{summary.cleaned_file_name}</p>
        </div>
      </div>

      <QualityGateBanner
        passed={gatePassed}
        qualityScore={summary.quality_score}
        qualityStatus={summary.quality_status}
        messages={summary.gate_messages}
        blockingCount={summary.blocking_issue_count}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris awal</p>
          <p className="mt-1 text-lg font-semibold">{summary.original_row_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris setelah</p>
          <p className="mt-1 text-lg font-semibold">{summary.cleaned_row_count}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Baris dihapus</p>
          <p className="mt-1 text-lg font-semibold">{summary.rows_removed}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sel diubah</p>
          <p className="mt-1 text-lg font-semibold">{summary.cells_modified}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary.actions_applied.map((actionId) => (
          <span
            key={actionId}
            className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700"
          >
            {actionLabel(actionId)}
          </span>
        ))}
      </div>

      {!gatePassed && summary.has_manual_review_issues && (
        <p className="mt-4 text-xs text-amber-800 dark:text-amber-200">
          Selesaikan tinjauan manual terlebih dahulu. Unduh data final hanya tersedia setelah dataset lulus
          pemeriksaan kualitas.
        </p>
      )}
    </div>
  );
}
