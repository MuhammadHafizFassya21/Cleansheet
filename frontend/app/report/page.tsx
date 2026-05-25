"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  analyzeCsvFile,
  generateReportFromDatasetId,
  getCleaningPreview,
  generateAIInsight,
} from "@/lib/api";
import {
  AIInsightResponse,
  CleaningPreviewResponse,
  DataQualityAnalysisResponse,
} from "@/lib/types";
import { getActiveReportDatasetId, getWorkflowState, saveWorkflowState } from "@/lib/workflow-store";
import ReportHeader from "@/components/report/ReportHeader";
import ReportUploadCard from "@/components/report/ReportUploadCard";
import DatasetOverviewCard from "@/components/report/DatasetOverviewCard";
import ReportQualitySection from "@/components/report/ReportQualitySection";
import ReportIssueSummary from "@/components/report/ReportIssueSummary";
import ReportAIInsight from "@/components/report/ReportAIInsight";
import ReportRecommendations from "@/components/report/ReportRecommendations";
import ReportNextSteps from "@/components/report/ReportNextSteps";

function ReportContent() {
  const searchParams = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workflowDatasetId, setWorkflowDatasetId] = useState<string | null>(null);
  const [workflowFileName, setWorkflowFileName] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<"workflow" | "upload" | null>(null);

  const [analysis, setAnalysis] = useState<DataQualityAnalysisResponse | null>(null);
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);

  const [autoReportAttempted, setAutoReportAttempted] = useState(false);

  useEffect(() => {
    const queryId = searchParams.get("datasetId");
    const workflow = getWorkflowState();
    const datasetId = queryId || getActiveReportDatasetId();
    if (datasetId) {
      setWorkflowDatasetId(datasetId);
      setWorkflowFileName(workflow.fileName);
    }
  }, [searchParams]);

  useEffect(() => {
    const queryId = searchParams.get("datasetId");
    if (!queryId || autoReportAttempted || analysis || loading) return;
    setAutoReportAttempted(true);
    runReportFromDatasetId(queryId);
  }, [searchParams, autoReportAttempted, analysis, loading]);

  const topProblemColumns = useMemo(() => {
    if (!analysis?.top_problem_columns?.length) return [];
    return analysis.top_problem_columns.slice(0, 3);
  }, [analysis]);

  const displayFileName =
    reportSource === "workflow"
      ? workflowFileName || "Dataset dari alur"
      : selectedFile?.name;

  const runReportFromDatasetId = async (datasetId: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setInsight(null);
    setPreview(null);

    try {
      const result = await generateReportFromDatasetId(datasetId);
      setAnalysis(result.analysis);
      setPreview(result.preview);
      setInsight(result.insight);
      setReportSource("workflow");
      saveWorkflowState({ stage: "manual_reviewed" });
    } catch (err: any) {
      setError(err?.message || "Gagal membuat laporan dari dataset.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromWorkflow = async () => {
    const id = searchParams.get("datasetId") || workflowDatasetId || getActiveReportDatasetId();
    if (!id) {
      setError("Tidak ada dataset aktif. Selesaikan upload atau tinjauan manual terlebih dahulu.");
      return;
    }
    await runReportFromDatasetId(id);
  };

  const handleGenerateFromUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setInsight(null);
    setPreview(null);

    try {
      const analysisResult = await analyzeCsvFile(selectedFile);
      setAnalysis(analysisResult);

      const previewResult = await getCleaningPreview(selectedFile, []);
      setPreview(previewResult);

      const insightResult = await generateAIInsight({
        dataset_id: analysisResult.dataset_id,
        row_count: analysisResult.row_count ?? 0,
        column_count: analysisResult.column_count ?? 0,
        quality_score: analysisResult.quality_score,
        status: analysisResult.status,
        issue_summary: analysisResult.issue_summary,
        top_problem_columns: analysisResult.top_problem_columns,
        recommended_actions: previewResult.recommended_actions ?? null,
      });
      setInsight(insightResult);
      setReportSource("upload");

      saveWorkflowState({
        datasetId: analysisResult.dataset_id,
        fileName: selectedFile.name,
        stage: "analyzed",
        analysis: analysisResult,
      });
    } catch (err: any) {
      setError(err?.message || "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 space-y-8">
      <ReportHeader />

      <ReportUploadCard
        selectedFile={selectedFile}
        onFileSelect={(file) => {
          setSelectedFile(file);
          setError(null);
          setAnalysis(null);
          setInsight(null);
          setPreview(null);
          setReportSource(null);
        }}
        onGenerate={handleGenerateFromUpload}
        onGenerateFromWorkflow={handleGenerateFromWorkflow}
        loading={loading}
        error={error}
        workflowDatasetId={workflowDatasetId}
        workflowFileName={workflowFileName}
      />

      {loading && (
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 dark:border-slate-800/60 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            Membuat laporan… (analisis → insight AI → rekomendasi)
          </div>
        </div>
      )}

      {analysis && (
        <>
          {reportSource === "workflow" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              Laporan dibuat dari dataset hasil alur pembersihan/tinjauan — tanpa unggah ulang.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <DatasetOverviewCard
              fileName={displayFileName}
              rowCount={analysis.row_count ?? null}
              columnCount={analysis.column_count ?? null}
              status={analysis.status}
              totalIssues={analysis.issue_summary.total_issues}
            />
            <ReportQualitySection score={analysis.quality_score} />
          </div>

          <ReportIssueSummary summary={analysis.issue_summary} />

          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Kolom Paling Bermasalah</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Kolom dengan jumlah isu terbanyak.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topProblemColumns.length ? (
                topProblemColumns.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100"
                  >
                    {col}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-600 dark:text-slate-300">—</span>
              )}
            </div>
          </div>
        </>
      )}

      {insight && <ReportAIInsight insight={insight} />}

      {preview?.recommended_actions?.length ? (
        <ReportRecommendations actions={preview.recommended_actions} />
      ) : null}

      {analysis && preview && (
        <>
          <ReportNextSteps />
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Alur lengkap:{" "}
            <Link className="underline" href="/upload">
              Upload
            </Link>
            {" → "}
            <Link className="underline" href="/dashboard">
              Dashboard
            </Link>
            {" → "}
            <Link className="underline" href="/clean">
              Bersihkan
            </Link>
            {" → "}
            <Link className="underline" href="/manual-review">
              Tinjauan Manual
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">Memuat…</div>}>
      <ReportContent />
    </Suspense>
  );
}
