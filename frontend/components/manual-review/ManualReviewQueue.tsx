"use client";

import React from "react";
import { ManualReviewIssue, ManualValidationResult } from "@/lib/types";
import ManualReviewTable from "./ManualReviewTable";

/** @deprecated Use ManualReviewTable — kept as alias for imports */
export default function ManualReviewQueue({
  issues,
  draftEdits,
  validated,
  validateLoadingId,
  markedValidIssues,
  onEditChange,
  onValidate,
  onMarkValid,
}: {
  issues: ManualReviewIssue[];
  draftEdits: Record<string, string>;
  validated: Record<string, ManualValidationResult | null>;
  validateLoadingId: string | null;
  markedValidIssues: Record<string, boolean>;
  onEditChange: (issueId: string, newValue: string) => void;
  onValidate: (issue: ManualReviewIssue) => void;
  onMarkValid: (issue: ManualReviewIssue) => void;
}) {
  return (
    <ManualReviewTable
      issues={issues}
      draftEdits={draftEdits}
      validated={validated}
      validateLoadingId={validateLoadingId}
      markedValidIssues={markedValidIssues}
      onEditChange={onEditChange}
      onValidate={onValidate}
      onMarkValid={onMarkValid}
    />
  );
}

