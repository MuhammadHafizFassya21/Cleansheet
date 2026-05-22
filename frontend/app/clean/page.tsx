"use client";

import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getCleaningPreview,
  applyCleaningActions,
  getCleanedCsvDownloadUrl,
} from "@/lib/api";
import { CleaningPreviewResponse, CleaningApplyResponse } from "@/lib/types";
import CleaningHeader from "@/components/clean/CleaningHeader";
import CleaningUploadCard from "@/components/clean/CleaningUploadCard";
import CleaningEmptyState from "@/components/clean/CleaningEmptyState";
import CleaningLoadingState from "@/components/clean/CleaningLoadingState";
import CleaningErrorState from "@/components/clean/CleaningErrorState";
import RecommendedActions from "@/components/clean/RecommendedActions";
import BeforeAfterPreviewTable from "@/components/clean/BeforeAfterPreviewTable";
import CleaningSummaryCard from "@/components/clean/CleaningSummaryCard";
import Link from "next/link";

export default function CleanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<CleaningApplyResponse | null>(null);

  const downloadUrl = useMemo(() => {
    if (!applyResult?.download_id) return null;
    // Cache-buster to avoid the browser reusing a previous download response.
    return `${getCleanedCsvDownloadUrl(applyResult.download_id)}?ts=${Date.now()}`;
  }, [applyResult]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreview(null);
    setError(null);
    setSelectedActions([]);

    setApplyResult(null);
    setApplyError(null);
  };

  const handleGetRecommendations = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getCleaningPreview(selectedFile, []);
      setPreview(result);
      setSelectedActions([]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Tidak dapat membuat pratinjau pembersihan.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = (actionId: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
  };

  const handlePreviewSelected = async () => {
    if (!selectedFile || !preview) return;

    setPreviewLoading(true);
    setError(null);

    setApplyResult(null);
    setApplyError(null);

    try {
      const result = await getCleaningPreview(selectedFile, selectedActions);
      setPreview(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Tidak dapat membuat pratinjau pembersihan.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <CleaningHeader />

      <div className="mt-10 mb-10">
        <CleaningUploadCard
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onGetRecommendations={handleGetRecommendations}
          loading={loading}
          error={error}
        />
      </div>

      {loading ? (
        <CleaningLoadingState />
      ) : error && !preview ? (
        <CleaningErrorState message={error} />
      ) : !preview ? (
        <CleaningEmptyState />
      ) : (
        <div className="space-y-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Manual review required
            </div>
            <div className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
              Some issues cannot be safely fixed automatically. Review invalid emails, invalid phone numbers, suspicious negative values, or strange characters manually.
            </div>
            <div className="mt-4">
              <Link
                href="/manual-review"
                className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Review &amp; Fix Manually
              </Link>
            </div>
          </div>

          <RecommendedActions
            actions={preview.recommended_actions}
            selectedActions={selectedActions}
            onToggle={handleToggleAction}
          />

          {selectedActions.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handlePreviewSelected}
                disabled={previewLoading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat pratinjau…
                  </>
                ) : (
                  "Pratinjau Perbaikan Terpilih"
                )}
              </button>
            </div>
          )}

          <BeforeAfterPreviewTable
            changes={preview.preview_changes}
            totalChanges={preview.total_preview_changes}
          />

          {selectedActions.length > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  if (!selectedFile) return;

                  setApplyLoading(true);
                  setApplyError(null);
                  setApplyResult(null);

                  try {
                    const result = await applyCleaningActions(selectedFile, selectedActions);
                    setApplyResult(result);
                  } catch (err: any) {
                    console.error(err);
                    setApplyError(err?.message || "Tidak dapat menerapkan aksi pembersihan.");
                  } finally {
                    setApplyLoading(false);
                  }
                }}
                disabled={applyLoading}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {applyLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menerapkan perbaikan…
                  </>
                ) : (
                  "Terapkan Perbaikan Terpilih"
                )}
              </button>
            </div>
          )}

          {applyError && <CleaningErrorState message={applyError} />}

          {applyResult && (
            <>
              <div className="flex justify-center">
                <CleaningSummaryCard summary={applyResult} />
              </div>

              <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
                <a
                  href={downloadUrl ?? undefined}
                  download={applyResult.cleaned_file_name}
                  className={`inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${!downloadUrl ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  Unduh CSV Bersih
                </a>

                <Link
                  href="/manual-review"
                  className="inline-flex items-center justify-center rounded-3xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Perbaiki data manual
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
