"use client";

import React, { useState } from "react";
import Link from "next/link";
import { uploadCsvFile } from "@/lib/api";
import { DatasetPreviewResponse } from "@/lib/types";
import FileUploadBox from "@/components/upload/FileUploadBox";
import DatasetPreviewTable from "@/components/upload/DatasetPreviewTable";
import { Upload, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DatasetPreviewResponse | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setPreviewData(null); // Reset preview when file changes
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      const data = await uploadCsvFile(selectedFile);
      setPreviewData(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Terjadi kesalahan saat mengunggah berkas CSV.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Upload Dataset
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Unggah berkas CSV Anda untuk melihat struktur data dan pratinjau kolom sebelum menjalankan pembersihan kualitas data.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Upload Box container */}
        {!previewData && (
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white/50 dark:border-slate-800 dark:bg-slate-900/30">
            <FileUploadBox
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              error={error}
            />

            {selectedFile && (
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-600 shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      <span>Unggah & Pratinjau CSV</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview and Navigation Area */}
        {previewData && (
          <div className="space-y-8">
            {/* Success Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 dark:border-emerald-950/20 dark:bg-emerald-950/10 gap-4">
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                Berkas **{previewData.file_name}** berhasil diunggah dan dianalisis awal.
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-850 dark:hover:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Ganti File
                </button>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors shadow-xs"
                >
                  Lanjut ke Dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Dataset Preview Component */}
            <DatasetPreviewTable dataset={previewData} />
          </div>
        )}
      </div>
    </div>
  );
}
