"use client";

import React from "react";
import { ManualReviewIssue } from "@/lib/types";
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
  validated: Record<string, any>;
  validateLoadingId: string | null;
  markedValidIssues: Record<string, boolean>;
  onEditChange: (issueId: string, newValue: string) => void;
  onValidate: (issue: ManualReviewIssue) => void;
  onMarkValid: (issue: ManualReviewIssue) => void;
}) {
  if (!issues.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {issues.map((issue) => (
        <ManualEditCard
          key={issue.id}
          issue={issue}
          value={draftEdits[issue.id] ?? (issue.current_value ?? "")}
          validatedResult={validated[issue.id] ?? null}
          validateLoading={validateLoadingId === issue.id}
          markedValid={!!markedValidIssues[issue.id]}
          onValueChange={(v) => onEditChange(issue.id, v)}
          onValidate={() => onValidate(issue)}
          onMarkValid={() => onMarkValid(issue)}
        />
      ))}
    </div>
  );
}

