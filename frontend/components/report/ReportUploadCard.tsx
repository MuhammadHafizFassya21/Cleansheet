"use client";

import React from "react";
import { Loader2, Upload } from "lucide-react";
import { SUPPORTED_DATA_ACCEPT } from "@/lib/supported-file-types";

type Props = {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onGenerate: () => void;
  onGenerateFromWorkflow: () => void;
  loading: boolean;
  error: string | null;
  workflowDatasetId: string | null;
  workflowFileName: string | null;
};

export default function ReportUploadCard({
  selectedFile,
  onFileSelect,
  onGenerate,
  onGenerateFromWorkflow,
  loading,
  error,
  workflowDatasetId,
  workflowFileName,
}: Props) {
  return (
    <div className="space-y-4">
      {workflowDatasetId && (
        <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/50 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
            Opsi 1 — Laporan dari alur sebelumnya
          </p>
          <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-200/90">
            Gunakan dataset setelah upload, pembersihan, atau tinjauan manual
            {workflowFileName ? (
              <>
                {" "}
                (<strong>{workflowFileName}</strong>)
              </>
            ) : null}
            . Tidak perlu unggah ulang.
          </p>
          <button
            type="button"
            onClick={onGenerateFromWorkflow}
            disabled={loading}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat laporan…
              </>
            ) : (
              "Buat Laporan dari Dataset Aktif"
            )}
          </button>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Opsi 2 — Unggah file baru
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Unggah file data lain untuk membuat laporan mandiri (CSV, Excel, TSV).
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-200">
            <Upload className="h-3.5 w-3.5" />
            Data
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="block">
            <span className="sr-only">Choose file</span>
            <input
              type="file"
              accept={SUPPORTED_DATA_ACCEPT}
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
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:bg-slate-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat…
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
    </div>
  );
}
