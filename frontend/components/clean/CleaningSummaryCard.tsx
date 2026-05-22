"use client";

import React from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { CleaningApplyResponse } from "@/lib/types";

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
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Pembersihan selesai
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {summary.cleaned_file_name}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Baris awal
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.original_row_count}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Baris setelah
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.cleaned_row_count}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Baris dihapus
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.rows_removed}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Sel diubah
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            {summary.cells_modified}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          Aksi diterapkan:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.actions_applied.map((actionId) => (
            <span
              key={actionId}
              className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700"
            >
              {actionLabel(actionId)}
            </span>
          ))}
          {summary.actions_applied.length === 0 && (
            <span className="text-xs text-slate-500">-</span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 p-4 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Beberapa isu mungkin masih memerlukan peninjauan manual, seperti email tidak valid, nomor telepon tidak valid, atau nilai negatif yang mencurigakan. Lakukan analisis ulang setelah pembersihan untuk memastikan kesiapan dataset.
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Siap diunduh:{" "}
          <span className="font-semibold text-slate-900 dark:text-white">
            {summary.download_ready ? "Ya" : "Tidak"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Download className="h-4 w-4" />
          <span className="font-semibold text-slate-900 dark:text-white">
            {summary.download_ready ? "Tersedia" : "Terapkan agar aktif"}
          </span>
        </div>
      </div>
    </div>
  );
}
