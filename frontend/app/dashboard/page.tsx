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

          <div className="flex justify-end">
            <Link
              href="/clean"
              className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition-colors hover:bg-slate-800"
            >
              Continue to Cleaning
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
