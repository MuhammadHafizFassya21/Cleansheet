"use client";

import React from "react";
import { Loader2, Upload } from "lucide-react";

type Props = {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string | null;
};

export default function ReportUploadCard({
  selectedFile,
  onFileSelect,
  onGenerate,
  loading,
  error,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            Unggah CSV untuk Membuat Laporan
          </p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Halaman ini berdiri sendiri. Unggah CSV lagi untuk membuat ringkasan laporan final.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200">
          <Upload className="h-3.5 w-3.5" />
          CSV
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="block">
          <span className="sr-only">Choose CSV</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-600 text-slate-700 dark:text-slate-200"
          />
        </label>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!selectedFile || loading}
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Membuat laporan…
            </>
          ) : (
            "Buat Laporan"
          )}
        </button>
      </div>

      {selectedFile && (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          Dipilih: <span className="font-medium">{selectedFile.name}</span>
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}
