"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { analyzeCsvFile, generateAIInsight, getCleaningPreview } from "@/lib/api";
import {
  AIInsightResponse,
  CleaningPreviewResponse,
  DataQualityAnalysisResponse,
} from "@/lib/types";
import ReportHeader from "@/components/report/ReportHeader";
import ReportUploadCard from "@/components/report/ReportUploadCard";
import DatasetOverviewCard from "@/components/report/DatasetOverviewCard";
import ReportQualitySection from "@/components/report/ReportQualitySection";
import ReportIssueSummary from "@/components/report/ReportIssueSummary";
import ReportAIInsight from "@/components/report/ReportAIInsight";
import ReportRecommendations from "@/components/report/ReportRecommendations";
import ReportNextSteps from "@/components/report/ReportNextSteps";

export default function ReportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<DataQualityAnalysisResponse | null>(null);
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);

  const topProblemColumns = useMemo(() => {
    if (!analysis?.top_problem_columns?.length) return [];
    return analysis.top_problem_columns.slice(0, 3);
  }, [analysis]);

  const handleGenerate = async () => {
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

      const insightPayload = {
        dataset_id: analysisResult.dataset_id,
        row_count: analysisResult.row_count ?? 0,
        column_count: analysisResult.column_count ?? 0,
        quality_score: analysisResult.quality_score,
        status: analysisResult.status,
        issue_summary: analysisResult.issue_summary,
        top_problem_columns: analysisResult.top_problem_columns,
        recommended_actions: previewResult.recommended_actions ?? null,
      };

      const insightResult = await generateAIInsight(insightPayload);
      setInsight(insightResult);
    } catch (err: any) {
      console.error(err);
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
        }}
        onGenerate={handleGenerate}
        loading={loading}
        error={error}
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
          <div className="grid gap-6 lg:grid-cols-2">
            <DatasetOverviewCard
              fileName={selectedFile?.name}
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
            Tips: gunakan <Link className="underline" href="/clean">Bersihkan</Link> untuk pratinjau dan menerapkan perbaikan.
          </div>
        </>
      )}
    </div>
  );
}
