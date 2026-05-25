"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  applyManualReviewFixes,
  getManualReviewDownloadUrl,
  getManualReviewIssues,
  getManualReviewIssuesByDatasetId,
  validateManualValue,
} from "@/lib/api";
import {
  ManualEditRequest,
  ManualReviewApplyResponse,
  ManualReviewIssue,
  ManualValidationResult,
} from "@/lib/types";
import { getWorkflowState, saveWorkflowState } from "@/lib/workflow-store";

import ManualReviewHeader from "@/components/manual-review/ManualReviewHeader";
import ManualReviewNotice from "@/components/manual-review/ManualReviewNotice";
import ManualReviewUploadCard from "@/components/manual-review/ManualReviewUploadCard";
import ManualReviewQueue from "@/components/manual-review/ManualReviewQueue";
import ManualReviewEmptyState from "@/components/manual-review/ManualReviewEmptyState";
import ManualReviewSummary from "@/components/manual-review/ManualReviewSummary";

function ManualReviewContent() {
  const searchParams = useSearchParams();

  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [issues, setIssues] = useState<ManualReviewIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuesLoaded, setIssuesLoaded] = useState(false);

  const [validateLoading, setValidateLoading] = useState<string | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ManualReviewApplyResponse | null>(null);

  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<Record<string, ManualValidationResult | null>>({});
  const [markedValidIssues, setMarkedValidIssues] = useState<Record<string, boolean>>({});

  const downloadUrl = useMemo(() => {
    if (!applyResult?.download_id) return null;
    return `${getManualReviewDownloadUrl(applyResult.download_id)}?ts=${Date.now()}`;
  }, [applyResult]);

  const reportHref = useMemo(() => {
    const id =
      applyResult?.final_dataset_id ||
      datasetId ||
      getWorkflowState().cleanedDatasetId ||
      getWorkflowState().datasetId;
    return id ? `/report?datasetId=${encodeURIComponent(id)}` : "/report";
  }, [applyResult, datasetId]);

  useEffect(() => {
    const datasetIdFromQuery = searchParams.get("datasetId");
    if (!datasetIdFromQuery) return;
    setDatasetId((prev) => (prev === datasetIdFromQuery ? prev : datasetIdFromQuery));
  }, [searchParams]);

  useEffect(() => {
    if (!datasetId) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setIssuesLoaded(false);

        if (cancelled) return;

        setIssues([]);
        setApplyResult(null);
        setApplyError(null);
        setDraftEdits({});
        setValidated({});
        setMarkedValidIssues({});

        const result = await getManualReviewIssuesByDatasetId(datasetId);
        if (cancelled) return;
        setIssues(result.manual_review_issues);
        setIssuesLoaded(true);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Unable to load manual review from cleaned dataset.");
        setIssuesLoaded(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setDatasetId(null);
    setIssues([]);
    setError(null);
    setApplyResult(null);
    setApplyError(null);
    setDraftEdits({});
    setValidated({});
    setMarkedValidIssues({});
    setIssuesLoaded(false);
  };

  const handleFindIssues = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setApplyResult(null);
    setApplyError(null);

    try {
      const result = await getManualReviewIssues(selectedFile);
      setDatasetId(result.dataset_id);
      setIssues(result.manual_review_issues);
      setIssuesLoaded(true);
    } catch (err: any) {
      setError(err?.message || "Unable to find manual review issues.");
      setIssuesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const onEditChange = (issueId: string, newValue: string) => {
    setDraftEdits((prev) => ({ ...prev, [issueId]: newValue }));
    setValidated((prev) => ({ ...prev, [issueId]: null }));
  };

  const onValidate = async (issue: ManualReviewIssue) => {
    const value = draftEdits[issue.id] ?? issue.current_value ?? "";
    setValidateLoading(issue.id);

    try {
      const res = await validateManualValue({
        row_index: issue.row_index,
        column: issue.column,
        value,
        issue_type: issue.type,
      });
      setValidated((prev) => ({ ...prev, [issue.id]: res }));
    } catch (err: any) {
      setValidated((prev) => ({
        ...prev,
        [issue.id]: {
          row_index: issue.row_index,
          column: issue.column,
          value: value,
          is_valid: false,
          issue_type: issue.type,
          message: err?.message || "Validation failed.",
        },
      }));
    } finally {
      setValidateLoading(null);
    }
  };

  const onMarkValid = (issue: ManualReviewIssue) => {
    setMarkedValidIssues((prev) => ({
      ...prev,
      [issue.id]: true,
      [issue.stable_key]: true,
    }));
  };

  const handleApply = async () => {
    if (!selectedFile && !datasetId) return;

    const edits: ManualEditRequest[] = [];
    const markedIds: string[] = [];

    for (const issue of issues) {
      const newVal = draftEdits[issue.id];
      const valRes = validated[issue.id];
      
      const hasEdit = typeof newVal === "string" && newVal.trim() !== "";

      if (hasEdit) {
        // If user typed something, treat it as an edit regardless of "markedValid" state.
        // We accept the edit if they validated it and it passed, OR if they didn't validate it explicitly (we send it to backend to apply).
        if (!valRes || valRes.is_valid === true) {
          edits.push({
            row_index: issue.row_index,
            column: issue.column,
            new_value: newVal.trim(),
          });
        }
      } else if (markedValidIssues[issue.id] || markedValidIssues[issue.stable_key]) {
        // Only mark as valid (keep original data) if they didn't type a new value
        markedIds.push(issue.stable_key);
      }
    }

    setApplyLoading(true);
    setApplyError(null);
    setApplyResult(null);

    try {
      const res = await applyManualReviewFixes(selectedFile, datasetId, edits, markedIds);
      setApplyResult(res);
      setIssues([]);
      saveWorkflowState({
        finalDatasetId: res.final_dataset_id,
        downloadId: res.download_id,
        stage: "manual_reviewed",
      });
    } catch (err: any) {
      const msg = err?.message || "Gagal menerapkan perbaikan manual.";
      setApplyError(msg);
    } finally {
      setApplyLoading(false);
    }
  };

  const fromCleanFlow = Boolean(datasetId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <ManualReviewHeader />

      <div className="mt-6">
        <ManualReviewNotice />
      </div>

      <div className="mt-10 mb-6">
        {datasetId ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 text-center dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
              Meninjau Dataset yang Telah Dicuci Otomatis
            </h3>
            <p className="text-sm text-indigo-900/80 dark:text-indigo-100/80">
              Hanya sel yang masih bermasalah setelah pembersihan otomatis. Data yang sudah benar tidak ditampilkan.
            </p>
          </div>
        ) : (
          <ManualReviewUploadCard
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onGetRecommendations={handleFindIssues}
            loading={loading}
            error={error}
          />
        )}
      </div>

      {loading && (
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat isu tinjauan manual…
        </div>
      )}

      {!loading && error && issues.length === 0 && (
        <div className="mt-8 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {!loading && issuesLoaded && issues.length === 0 && !applyResult && (
        <ManualReviewEmptyState fromCleanFlow={fromCleanFlow} reportHref={reportHref} />
      )}

      {issues.length > 0 && (
        <div className="space-y-8">
          <ManualReviewQueue
            issues={issues}
            draftEdits={draftEdits}
            validated={validated}
            validateLoadingId={validateLoading}
            markedValidIssues={markedValidIssues}
            onEditChange={onEditChange}
            onValidate={onValidate}
            onMarkValid={onMarkValid}
          />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleApply}
              disabled={applyLoading || (!selectedFile && !datasetId)}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {applyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menerapkan perbaikan…
                </>
              ) : (
                "Terapkan Perbaikan Manual"
              )}
            </button>
          </div>

          {applyError && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">{applyError}</div>
          )}
        </div>
      )}

      {applyResult && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <ManualReviewSummary summary={applyResult} downloadUrl={downloadUrl} reportHref={reportHref} />
        </div>
      )}
    </div>
  );
}

export default function ManualReviewPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 text-sm text-slate-500">Memuat…</div>}>
      <ManualReviewContent />
    </Suspense>
  );
}
