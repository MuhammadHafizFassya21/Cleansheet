"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import FileUploadBox from "@/components/upload/FileUploadBox";

interface AnalyzeUploadCardProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  onReset: () => void;
  loading: boolean;
  error: string | null;
}

export default function AnalyzeUploadCard({
  selectedFile,
  onFileSelect,
  onAnalyze,
  onReset,
  loading,
  error,
}: AnalyzeUploadCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300">
          <Loader2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Upload CSV for Analysis</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Drag and drop your CSV file or choose a file from your computer to begin the data quality check.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <FileUploadBox selectedFile={selectedFile} onFileSelect={onFileSelect} error={error} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {selectedFile ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              Selected: {selectedFile.name}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              No file selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {selectedFile && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!selectedFile || loading}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Data
              </>
            ) : (
              "Analyze Data"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
