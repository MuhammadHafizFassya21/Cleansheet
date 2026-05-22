"use client";

import React, { useState } from "react";
import Link from "next/link";
import { analyzeCsvFile } from "@/lib/api";
import { DataQualityAnalysisResponse } from "@/lib/types";
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

import ManualReviewNotice from "@/components/manual-review/ManualReviewNotice";


export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DataQualityAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeCsvFile(selectedFile);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to analyze the selected file.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <DashboardHeader />

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.95fr] mt-10 mb-10">
        <AnalyzeUploadCard
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          loading={loading}
          error={error}
        />

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

          {(
            analysis.issue_summary.invalid_email_count > 0 ||
            analysis.issue_summary.invalid_phone_count > 0 ||
            analysis.issue_summary.suspicious_negative_number_count > 0 ||
            analysis.issue_summary.strange_character_count > 0
          ) && (
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
          )}

          <div className="flex justify-end">
            <Link
              href="/clean"
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
