"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";


import {
  applyManualReviewFixes,
  getCsvFileFromCleanDownloadId,
  getManualReviewDownloadUrl,
  getManualReviewIssues,
  validateManualValue,
} from "@/lib/api";

import {
  ManualEditRequest,
  ManualReviewApplyResponse,
  ManualReviewIssue,
  ManualValidationResult,
} from "@/lib/types";

import ManualReviewHeader from "@/components/manual-review/ManualReviewHeader";
import ManualReviewNotice from "@/components/manual-review/ManualReviewNotice";
import ManualReviewUploadCard from "@/components/manual-review/ManualReviewUploadCard";
import ManualReviewQueue from "@/components/manual-review/ManualReviewQueue";
import ManualReviewEmptyState from "@/components/manual-review/ManualReviewEmptyState";
import ManualReviewSummary from "@/components/manual-review/ManualReviewSummary";

export default function ManualReviewPage() {
  return <ManualReviewInner />;
}

function ManualReviewInner() {

  // Accept clean output context: /manual-review?clean_download_id=clean_xxx
  const searchParams = useSearchParams();



  const [cleanDownloadId, setCleanDownloadId] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const [issues, setIssues] = useState<ManualReviewIssue[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [validateLoading, setValidateLoading] = useState<string | null>(null); // issue id
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<ManualReviewApplyResponse | null>(null);

  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({}); // issue id -> new value
  const [validated, setValidated] = useState<Record<string, ManualValidationResult | null>>({});
  const [markedValidIssues, setMarkedValidIssues] = useState<Record<string, boolean>>({});

  const downloadUrl = useMemo(() => {
    if (!applyResult?.download_id) return null;
    return `${getManualReviewDownloadUrl(applyResult.download_id)}?ts=${Date.now()}`;
  }, [applyResult]);

  useEffect(() => {
    const cleanDownloadIdFromQuery = searchParams.get("clean_download_id");
    if (!cleanDownloadIdFromQuery) return;

    // Avoid refetch loop
    setCleanDownloadId((prev) => (prev === cleanDownloadIdFromQuery ? prev : cleanDownloadIdFromQuery));
  }, [searchParams]);

  useEffect(() => {
    if (!cleanDownloadId) return;

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const file = await getCsvFileFromCleanDownloadId(cleanDownloadId);
        if (cancelled) return;

        setSelectedFile(file);
        setIssues([]);
        setApplyResult(null);
        setApplyError(null);
        setDraftEdits({});
        setValidated({});
        setMarkedValidIssues({});

        const result = await getManualReviewIssues(file);
        if (cancelled) return;
        setIssues(result.manual_review_issues);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Unable to load manual review from cleaned CSV.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cleanDownloadId]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);


    setIssues([]);
    setError(null);
    setApplyResult(null);
    setApplyError(null);
    setDraftEdits({});
    setValidated({});
    setMarkedValidIssues({});
  };

  const handleFindIssues = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setApplyResult(null);
    setApplyError(null);

    try {
      const result = await getManualReviewIssues(selectedFile);
      setIssues(result.manual_review_issues);
    } catch (err: any) {
      setError(err?.message || "Unable to find manual review issues.");
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
    setMarkedValidIssues((prev) => ({ ...prev, [issue.id]: true }));
  };

  const handleApply = async () => {
    if (!selectedFile) return;

    const edits: ManualEditRequest[] = [];
    const markedIds: string[] = [];

    for (const issue of issues) {
      if (markedValidIssues[issue.id]) {
        markedIds.push(issue.id);
        continue;
      }

      const newVal = draftEdits[issue.id];
      const valRes = validated[issue.id];

      // Only include in edits if user validated true or if issue is type suspicious_negative_number and they edited it
      if (typeof newVal === "string" && newVal.trim() !== "") {
        if (valRes?.is_valid) {
          edits.push({ row_index: issue.row_index, column: issue.column, new_value: newVal });
        }
      }
    }

    setApplyLoading(true);
    setApplyError(null);
    setApplyResult(null);

    try {
      const res = await applyManualReviewFixes(selectedFile, edits, markedIds);
      setApplyResult(res);
      setIssues([]);
    } catch (err: any) {
      setApplyError(err?.message || "Unable to apply manual fixes.");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <ManualReviewHeader />

      <div className="mt-6">
        <ManualReviewNotice />
      </div>

      <div className="mt-10 mb-6">
        <ManualReviewUploadCard
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onGetRecommendations={handleFindIssues}
          loading={loading}
          error={error}
        />
      </div>

      {issues.length === 0 && loading && (
        <div className="mt-8 text-sm text-slate-600 dark:text-slate-300">Finding issues…</div>
      )}

      {!loading && error && issues.length === 0 && (
        <div className="mt-8 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {!loading && !error && issues.length === 0 ? (
        <ManualReviewEmptyState />
      ) : (
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
              disabled={applyLoading || !selectedFile}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {applyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying fixes…
                </>
              ) : (
                "Apply Manual Fixes"
              )}
            </button>
          </div>

          {applyError && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center">{applyError}</div>
          )}

          {applyResult && (
            <div className="flex flex-col items-center gap-4">
              <ManualReviewSummary summary={applyResult} downloadUrl={downloadUrl} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

