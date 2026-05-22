"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { uploadCsvFile } from "@/lib/api";

export default function ManualReviewUploadCard({
  selectedFile,
  onFileSelect,
  onGetRecommendations,
  loading,
  error,
}: {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onGetRecommendations: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-base font-bold text-slate-900 dark:text-white">Upload CSV</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Upload a dataset to detect unresolved issues that require manual review.
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          Choose CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelect(f);
            }}
          />
        </label>

        {selectedFile && (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Selected: <span className="font-semibold">{selectedFile.name}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onGetRecommendations}
            disabled={loading || !selectedFile}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding issues…
              </>
            ) : (
              "Find Issues for Manual Review"
            )}
          </button>
        </div>

        {error && <div className="text-sm text-red-600 dark:text-red-400 text-center">{error}</div>}
      </div>
    </div>
  );
}

