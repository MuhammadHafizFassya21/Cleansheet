"use client";

import React from "react";
import { DatasetPreviewResponse } from "@/lib/types";
import { Table, Layers, FileSpreadsheet, HardDrive, CheckCircle } from "lucide-react";

interface DatasetPreviewTableProps {
  dataset: DatasetPreviewResponse;
}

export default function DatasetPreviewTable({ dataset }: DatasetPreviewTableProps) {
  // Utility for clean file size display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Byte";
    const k = 1024;
    const sizes = ["Byte", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Badge configuration based on data type
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "number":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30";
      case "date":
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
      case "boolean":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30";
      case "unknown":
        return "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30";
      default: // text
        return "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-750";
    }
  };

  return (
    <div className="w-full space-y-10 animate-fade-in">
      {/* 1. Dataset Metadata Cards */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Ringkasan Dataset
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* File Name */}
          <div className="rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Berkas</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                {dataset.file_name}
              </p>
            </div>
          </div>

          {/* File Size */}
          <div className="rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ukuran Berkas</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {formatBytes(dataset.file_size)}
              </p>
            </div>
          </div>

          {/* Rows */}
          <div className="rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Baris</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {dataset.row_count}
              </p>
            </div>
          </div>

          {/* Columns */}
          <div className="rounded-xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Kolom</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                {dataset.column_count}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Column Summary Table */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Statistik Struktur Kolom
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nama Kolom</th>
                  <th className="px-6 py-3.5">Tipe Terdeteksi</th>
                  <th className="px-6 py-3.5">Nilai Kosong</th>
                  <th className="px-6 py-3.5">Nilai Unik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
                {dataset.columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-3.5 font-semibold text-slate-800 dark:text-slate-200">{col.name}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${getTypeBadgeClass(col.detected_type)}`}>
                        {col.detected_type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {col.missing_count > 0 ? (
                        <span className="text-rose-500 font-semibold">{col.missing_count} sel kosong</span>
                      ) : (
                        <span className="text-emerald-500">0 (Bersih)</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-medium">{col.unique_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. First 20 Rows Preview Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data yang Rusak dan Perlu Diperbaiki
          </h2>
          <span className="text-xs text-slate-450 dark:text-slate-400">
            Menampilkan maks. 20 baris bermasalah
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-12 border-r border-slate-200 dark:border-slate-800">#</th>
                  {dataset.columns.map((col, idx) => (
                    <th key={idx} className="px-5 py-3.5 font-bold">{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
                {dataset.preview.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 text-center border-r border-slate-200 dark:border-slate-800 font-bold text-slate-300 dark:text-slate-600">
                      {row["_original_row_index"] ?? rowIdx + 1}
                    </td>
                    {dataset.columns.map((col, colIdx) => {
                      const cellVal = row[col.name];
                      const actualRowIndex = rowIdx + 1; // Not accurate if row_index is not sequential, but wait! We need the actual row index from the issue!
                      
                      // Find if this specific cell has an issue
                      // Wait! We don't have the actual row index of the row in the UI easily accessible unless we pass it, but dataset.preview_issues contains the actual row index.
                      // The row itself might not have an ID.
                      // Actually we should just check if this cell value and column match any issue in preview_issues for this row...
                      // Wait, let's just pass a generic check or add row_index to the preview row in backend.
                      // Since we can't easily correlate, let's just check if ANY issue in preview_issues has column == col.name and the value matches? But value isn't in preview_issues!
                      // Let's modify the backend to inject _original_row_index into the row.
                      // For now, let's just check if preview_issues has an issue for this column in this row (assuming rowIdx is just the index in the preview array).
                      // We need _original_row_index. I will modify the backend to inject it.
                      const originalRowIndex = row["_original_row_index"];
                      const cellIssue = dataset.preview_issues?.find(
                        (i) => i.column === col.name && i.row_index === originalRowIndex
                      );

                      const isMissing = cellVal === null || cellVal === undefined || cellVal === "";
                      const hasIssue = !!cellIssue;

                      return (
                        <td key={colIdx} className={`px-5 py-3 truncate max-w-[200px] ${hasIssue && !isMissing ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                          {isMissing ? (
                            <span className="text-rose-400/70 italic bg-rose-50/20 dark:bg-rose-950/10 px-1.5 py-0.5 rounded">NULL</span>
                          ) : hasIssue ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold" title={cellIssue.type}>
                              {String(cellVal)}
                            </span>
                          ) : typeof cellVal === "boolean" ? (
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {cellVal ? "BENAR" : "SALAH"}
                            </span>
                          ) : (
                            String(cellVal)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
