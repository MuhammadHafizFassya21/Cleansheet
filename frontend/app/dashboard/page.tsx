"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { analyzeCsvFile, analyzeDatasetById } from "@/lib/api";
import { DataQualityAnalysisResponse } from "@/lib/types";
import { getWorkflowState, saveWorkflowState } from "@/lib/workflow-store";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyzeUploadCard from "@/components/dashboard/AnalyzeUploadCard";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardLoadingState from "@/components/dashboard/DashboardLoadingState";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";
import QualityScoreCard from "@/components/dashboard/QualityScoreCard";
import IssueSummaryCards from "@/components/dashboard/IssueSummaryCards";
import IssueTable from "@/components/dashboard/IssueTable";
import TopProblemColumns from "@/components/dashboard/TopProblemColumns";
import IssueBreakdown from "@/components/dashboard/IssueBreakdown";

function DashboardContent() {
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DataQualityAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowDatasetId, setWorkflowDatasetId] = useState<string | null>(null);
  const [workflowFileName, setWorkflowFileName] = useState<string | null>(null);
  const [autoLoaded, setAutoLoaded] = useState(false);

  const runAnalyzeById = async (datasetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeDatasetById(datasetId);
      setAnalysis(result);
      saveWorkflowState({
        datasetId,
        stage: "analyzed",
        analysis: result,
      });
    } catch (err: any) {
      setError(err?.message || "Gagal menganalisis dataset dari sesi upload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoaded) return;

    const queryId = searchParams.get("datasetId");
    const workflow = getWorkflowState();
    const datasetId = queryId || workflow.datasetId;

    if (datasetId) {
      setWorkflowDatasetId(datasetId);
      setWorkflowFileName(workflow.fileName);
      setAutoLoaded(true);
      runAnalyzeById(datasetId);
    }
  }, [searchParams, autoLoaded]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysis(null);
    setError(null);
    setWorkflowDatasetId(null);
    setWorkflowFileName(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeCsvFile(selectedFile);
      setAnalysis(result);
      saveWorkflowState({
        datasetId: result.dataset_id,
        fileName: selectedFile.name,
        stage: "analyzed",
        analysis: result,
      });
      setWorkflowDatasetId(result.dataset_id);
      setWorkflowFileName(selectedFile.name);
    } catch (err: any) {
      setError(err?.message || "Unable to analyze the selected file.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
    setWorkflowDatasetId(null);
    setWorkflowFileName(null);
    setAutoLoaded(false);
  };

  const activeDatasetId = analysis?.dataset_id || workflowDatasetId;
  const cleanHref = activeDatasetId
    ? `/clean?datasetId=${encodeURIComponent(activeDatasetId)}`
    : "/clean";
  const manualReviewHref = activeDatasetId
    ? `/manual-review?datasetId=${encodeURIComponent(activeDatasetId)}`
    : "/manual-review";

  const isManuallyReviewed = activeDatasetId?.startsWith("ds_final_") ?? false;

  const needsManualReview =
    !isManuallyReviewed &&
    analysis &&
    (analysis.issue_summary.invalid_email_count > 0 ||
      analysis.issue_summary.invalid_phone_count > 0 ||
      analysis.issue_summary.suspicious_negative_number_count > 0 ||
      analysis.issue_summary.strange_character_count > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <DashboardHeader />

      {workflowDatasetId && !selectedFile && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            Menggunakan dataset dari upload
            {workflowFileName ? (
              <>
                : <strong>{workflowFileName}</strong>
              </>
            ) : null}
            . Tidak perlu unggah ulang.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.95fr] mt-10 mb-10">
        {!workflowDatasetId || selectedFile ? (
          <AnalyzeUploadCard
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            loading={loading}
            error={error}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Dataset siap dianalisis</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Skor kualitas ditampilkan di panel kanan. Untuk mengganti file, gunakan halaman Upload.
            </p>
            <Link
              href="/upload"
              className="mt-4 inline-block text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Unggah file baru →
            </Link>
          </div>
        )}

        <div>
          {loading ? (
            <DashboardLoadingState />
          ) : error ? (
            <DashboardErrorState message={error} />
          ) : analysis ? (
            <div className="space-y-6">
              <QualityScoreCard qualityScore={analysis.quality_score} />
              <TopProblemColumns columns={analysis.top_problem_columns} />
            </div>
          ) : (
            <DashboardEmptyState />
          )}
        </div>
      </div>

      {analysis && (
        <div className="space-y-8">
          <IssueSummaryCards summary={analysis.issue_summary} />

          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <IssueTable issues={analysis.issues} />
            <IssueBreakdown summary={analysis.issue_summary} />
          </div>

          {needsManualReview && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Manual review required
              </div>
              <div className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
                Beberapa isu tidak dapat diperbaiki otomatis. Tinjau email tidak valid, nomor telepon, angka negatif mencurigakan, atau karakter aneh secara manual.
              </div>
              <div className="mt-4">
                <Link
                  href={manualReviewHref}
                  className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Review &amp; Fix Manually
                </Link>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Link
              href={cleanHref}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition-colors hover:bg-slate-800"
            >
              Lanjut ke Pembersihan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">Memuat dashboard…</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
