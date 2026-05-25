"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { Loader2, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getCleaningPreview,
  applyCleaningActions,
  getCleanedCsvDownloadUrl,
} from "@/lib/api";
import { CleaningPreviewResponse, CleaningApplyResponse } from "@/lib/types";
import { getWorkflowState, saveWorkflowState } from "@/lib/workflow-store";
import CleaningHeader from "@/components/clean/CleaningHeader";
import CleaningUploadCard from "@/components/clean/CleaningUploadCard";
import CleaningEmptyState from "@/components/clean/CleaningEmptyState";
import CleaningLoadingState from "@/components/clean/CleaningLoadingState";
import CleaningErrorState from "@/components/clean/CleaningErrorState";
import RecommendedActions from "@/components/clean/RecommendedActions";
import BeforeAfterPreviewTable from "@/components/clean/BeforeAfterPreviewTable";
import CleaningSummaryCard from "@/components/clean/CleaningSummaryCard";

function CleanContent() {
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [workflowDatasetId, setWorkflowDatasetId] = useState<string | null>(null);
  const [workflowFileName, setWorkflowFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCompleted, setPreviewCompleted] = useState(false);

  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<CleaningApplyResponse | null>(null);

  const activeDatasetId = preview?.dataset_id || workflowDatasetId;

  const downloadUrl = useMemo(() => {
    if (!applyResult?.download_id) return null;
    return `${getCleanedCsvDownloadUrl(applyResult.download_id)}?ts=${Date.now()}`;
  }, [applyResult]);

  useEffect(() => {
    const queryId = searchParams.get("datasetId");
    const workflow = getWorkflowState();
    const datasetId = queryId || workflow.datasetId;
    if (datasetId) {
      setWorkflowDatasetId(datasetId);
      setWorkflowFileName(workflow.fileName);
    }
  }, [searchParams]);

  const canRunCleaning = Boolean(selectedFile || workflowDatasetId);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setWorkflowDatasetId(null);
    setPreview(null);
    setError(null);
    setSelectedActions([]);
    setPreviewCompleted(false);
    setApplyResult(null);
    setApplyError(null);
  };

  const handleGetRecommendations = async () => {
    if (!canRunCleaning) return;

    setLoading(true);
    setError(null);
    setPreviewCompleted(false);

    try {
      const result = await getCleaningPreview(
        selectedFile,
        [],
        workflowDatasetId
      );
      setPreview(result);
      setSelectedActions([]);
      if (result.is_already_clean) {
        setPreviewCompleted(true);
      }
    } catch (err: any) {
      setError(err?.message || "Tidak dapat membuat pratinjau pembersihan.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = (actionId: string) => {
    setSelectedActions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
    setPreviewCompleted(false);
  };

  const handlePreviewSelected = async () => {
    if (!canRunCleaning || !preview) return;

    setPreviewLoading(true);
    setError(null);
    setApplyResult(null);
    setApplyError(null);

    try {
      const result = await getCleaningPreview(
        selectedFile,
        selectedActions,
        workflowDatasetId || preview.dataset_id
      );
      setPreview(result);
      setPreviewCompleted(true);
    } catch (err: any) {
      setError(err?.message || "Tidak dapat membuat pratinjau pembersihan.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const showAlreadyCleanBanner =
    preview &&
    (preview.is_already_clean ||
      (previewCompleted &&
        selectedActions.length > 0 &&
        preview.total_preview_changes === 0));

  const manualReviewHref = applyResult?.cleaned_dataset_id
    ? `/manual-review?datasetId=${encodeURIComponent(applyResult.cleaned_dataset_id)}`
    : "/manual-review";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <CleaningHeader />

      {workflowDatasetId && !selectedFile && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            Menggunakan dataset dari alur sebelumnya
            {workflowFileName ? (
              <>
                : <strong>{workflowFileName}</strong>
              </>
            ) : null}
            .
          </p>
        </div>
      )}

      <div className="mt-10 mb-10">
        {(!workflowDatasetId || selectedFile) && (
          <CleaningUploadCard
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onGetRecommendations={handleGetRecommendations}
            loading={loading}
            error={error}
            hideUpload={Boolean(workflowDatasetId && !selectedFile)}
            onUseWorkflowDataset={workflowDatasetId ? handleGetRecommendations : undefined}
            workflowFileName={workflowFileName}
          />
        )}

        {workflowDatasetId && !selectedFile && !preview && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleGetRecommendations}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memuat rekomendasi…
                </>
              ) : (
                "Muat Rekomendasi Pembersihan"
              )}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <CleaningLoadingState />
      ) : error && !preview ? (
        <CleaningErrorState message={error} />
      ) : !preview ? (
        <CleaningEmptyState />
      ) : (
        <div className="space-y-8">
          {preview.is_already_clean && !selectedActions.length && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Data sudah bersih
                </p>
                <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
                  Tidak ada perbaikan otomatis yang direkomendasikan. Anda dapat lanjut ke tinjauan manual atau laporan.
                </p>
              </div>
            </div>
          )}

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

          {previewLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Menganalisis perubahan pratinjau…
            </div>
          )}

          {showAlreadyCleanBanner && selectedActions.length > 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900/50 dark:bg-sky-950/20">
              <Info className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                  Tidak ada perubahan untuk aksi terpilih
                </p>
                <p className="mt-1 text-sm text-sky-800/80 dark:text-sky-200/80">
                  Data Anda sudah memenuhi kriteria untuk aksi yang dipilih — tidak ada baris yang perlu diperbaiki.
                </p>
              </div>
            </div>
          )}

          <BeforeAfterPreviewTable
            changes={preview.preview_changes}
            totalChanges={preview.total_preview_changes}
            previewCompleted={previewCompleted}
            isAlreadyClean={Boolean(showAlreadyCleanBanner)}
          />

          {selectedActions.length > 0 && preview.total_preview_changes > 0 && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  if (!canRunCleaning) return;

                  setApplyLoading(true);
                  setApplyError(null);
                  setApplyResult(null);

                  try {
                    const result = await applyCleaningActions(
                      selectedFile,
                      selectedActions,
                      workflowDatasetId || preview.dataset_id
                    );
                    setApplyResult(result);
                    saveWorkflowState({
                      cleanedDatasetId: result.cleaned_dataset_id,
                      downloadId: result.download_id,
                      stage: "cleaned",
                    });
                  } catch (err: any) {
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
            <div className="space-y-6">
              <div className="flex justify-center">
                <CleaningSummaryCard summary={applyResult} />
              </div>

              {applyResult.has_manual_review_issues ? (
                <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/60 p-6 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    Tinjauan Manual Diperlukan
                  </div>
                  <div className="text-sm text-amber-900/80 dark:text-amber-100/80 mb-4">
                    Terdapat <strong>{applyResult.remaining_manual_review_count}</strong> isu yang perlu ditinjau manual.
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={manualReviewHref}
                      className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                    >
                      Lanjutkan ke Tinjauan Manual
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-2xl text-center">
                  <Link
                    href={`/report?datasetId=${encodeURIComponent(applyResult.cleaned_dataset_id)}`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Lanjut ke Laporan
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center mt-6">
                <a
                  href={downloadUrl ?? undefined}
                  download={applyResult.cleaned_file_name}
                  title={
                    applyResult.download_ready
                      ? "Dataset lulus pemeriksaan kualitas"
                      : "Unduh dinonaktifkan — selesaikan tinjauan manual atau perbaiki isu yang tersisa"
                  }
                  className={`inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-colors ${
                    !downloadUrl || !applyResult.download_ready
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {applyResult.download_ready ? "Unduh CSV Bersih" : "Unduh (perlu tinjauan manual)"}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CleanPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">Memuat…</div>}>
      <CleanContent />
    </Suspense>
  );
}
