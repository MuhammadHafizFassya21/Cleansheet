"use client";

import React from "react";
import { CleaningPreviewChange } from "@/lib/types";

interface BeforeAfterPreviewTableProps {
  changes: CleaningPreviewChange[];
  totalChanges: number;
}

const actionLabel = (actionId: string) => {
  const map: Record<string, string> = {
    trim_whitespace: "Trim whitespace",
    normalize_phone: "Normalisasi telepon",
    remove_duplicates: "Hapus duplikat",
    standardize_missing_values: "Standarkan missing value",
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
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Pratinjau Sebelum vs Sesudah</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Menampilkan {changes.length} dari {totalChanges} perubahan
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-[0.16em] dark:border-slate-800 dark:bg-slate-900">
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Baris</th>
              <th className="px-4 py-3">Kolom</th>
              <th className="px-4 py-3">Asli</th>
              <th className="px-4 py-3">Hasil</th>
              <th className="px-4 py-3">Pesan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {changes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Tidak ada perubahan untuk dipratinjau. Pilih aksi pembersihan untuk melihat perubahan.
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
                    {change.original_value || "(kosong)"}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate font-medium text-emerald-600 dark:text-emerald-400">
                    {change.cleaned_value || "(kosong)"}
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
