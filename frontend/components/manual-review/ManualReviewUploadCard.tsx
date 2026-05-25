"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import FileUploadBox from "@/components/upload/FileUploadBox";

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
          <div className="text-base font-bold text-slate-900 dark:text-white">Unggah Dataset</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Unggah file data untuk mendeteksi isu yang memerlukan tinjauan manual.
          </div>
        </div>

        <FileUploadBox selectedFile={selectedFile} onFileSelect={onFileSelect} error={error} />

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
                Mencari isu…
              </>
            ) : (
              "Cari Isu Tinjauan Manual"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
