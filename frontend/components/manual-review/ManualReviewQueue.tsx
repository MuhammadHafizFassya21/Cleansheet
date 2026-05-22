"use client";

import React from "react";
import { ManualReviewIssue, ManualValidationResult } from "@/lib/types";
import ManualEditCard from "./ManualEditCard";

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
  if (!issues.length) return null;

  return (
    <div className="space-y-4">
      {issues.map((issue) => {
        const value = draftEdits[issue.id] ?? issue.current_value ?? "";
        const validatedResult = validated[issue.id] ?? null;
        return (
          <ManualEditCard
            key={issue.id}
            issue={issue}
            value={value}
            validatedResult={validatedResult}
            validateLoading={validateLoadingId === issue.id}
            markedValid={!!markedValidIssues[issue.id]}
            onValueChange={(v) => onEditChange(issue.id, v)}
            onValidate={() => onValidate(issue)}
            onMarkValid={() => onMarkValid(issue)}
          />
        );
      })}
    </div>
  );
}

