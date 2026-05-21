"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { getCleaningPreview } from "@/lib/api";
import { CleaningPreviewResponse } from "@/lib/types";
import CleaningHeader from "@/components/clean/CleaningHeader";
import CleaningUploadCard from "@/components/clean/CleaningUploadCard";
import CleaningEmptyState from "@/components/clean/CleaningEmptyState";
import CleaningLoadingState from "@/components/clean/CleaningLoadingState";
import CleaningErrorState from "@/components/clean/CleaningErrorState";
import RecommendedActions from "@/components/clean/RecommendedActions";
import BeforeAfterPreviewTable from "@/components/clean/BeforeAfterPreviewTable";

export default function CleanPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CleaningPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreview(null);
    setError(null);
    setSelectedActions([]);
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
      setError(err?.message || "Unable to generate cleaning preview.");
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

    try {
      const result = await getCleaningPreview(selectedFile, selectedActions);
      setPreview(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to generate cleaning preview.");
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
                    Generating Preview
                  </>
                ) : (
                  "Preview Selected Fixes"
                )}
              </button>
            </div>
          )}

          <BeforeAfterPreviewTable
            changes={preview.preview_changes}
            totalChanges={preview.total_preview_changes}
          />

          <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              Download Cleaned CSV
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">Coming in Phase 7</span>
          </div>
        </div>
      )}
    </div>
  );
}
