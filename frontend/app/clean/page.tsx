"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { applyCleaningActions, getCleanedCsvDownloadUrl, getCleaningPreview } from "@/lib/api";
import { CleaningApplyResponse, CleaningPreviewResponse } from "@/lib/types";
import CleaningHeader from "@/components/clean/CleaningHeader";
import CleaningUploadCard from "@/components/clean/CleaningUploadCard";
import CleaningEmptyState from "@/components/clean/CleaningEmptyState";
import CleaningLoadingState from "@/components/clean/CleaningLoadingState";
import CleaningErrorState from "@/components/clean/CleaningErrorState";
import RecommendedActions from "@/components/clean/RecommendedActions";
import BeforeAfterPreviewTable from "@/components/clean/BeforeAfterPreviewTable";
import CleaningSummaryCard from "@/components/clean/CleaningSummaryCard";

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

  const handleApplySelected = async () => {
    if (!selectedFile) return;
    if (selectedActions.length === 0) return;

    setApplyLoading(true);
    setApplyError(null);

    try {
      const result: CleaningApplyResponse = await applyCleaningActions(selectedFile, selectedActions);
      setApplyResult(result);
    } catch (err: any) {
      console.error(err);
      setApplyError(err?.message || "Unable to apply cleaning actions.");
    } finally {
      setApplyLoading(false);
    }
  };

  const downloadUrl = applyResult?.download_id ? getCleanedCsvDownloadUrl(applyResult.download_id) : null;

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

          <div className="space-y-4">
            {applyError && <CleaningErrorState message={applyError} />}

            {applyResult ? (
              <>
                <CleaningSummaryCard summary={applyResult} />

                {downloadUrl && (
                  <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center justify-center rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                      download={applyResult.cleaned_file_name}
                    >
                      Download Cleaned CSV
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-3 items-center sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleApplySelected}
                  disabled={applyLoading || selectedActions.length === 0}
                  className="inline-flex items-center justify-center rounded-3xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {applyLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying Fixes
                    </>
                  ) : (
                    "Apply Selected Fixes"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
