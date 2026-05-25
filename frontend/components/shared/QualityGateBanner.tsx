"use client";

import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

type Props = {
  passed: boolean;
  qualityScore?: number;
  qualityStatus?: string;
  messages?: string[];
  blockingCount?: number;
};

export default function QualityGateBanner({
  passed,
  qualityScore,
  qualityStatus,
  messages = [],
  blockingCount = 0,
}: Props) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        passed
          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          : "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20"
      }`}
    >
      <div className="flex items-start gap-3">
        {passed ? (
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold ${
              passed
                ? "text-emerald-900 dark:text-emerald-100"
                : "text-amber-900 dark:text-amber-100"
            }`}
          >
            {passed
              ? "Lulus pemeriksaan kualitas final"
              : "Belum lulus — data tidak dapat diekspor"}
          </p>
          {(qualityScore !== undefined || qualityStatus) && (
            <p className="mt-1 text-xs opacity-90">
              Skor: <strong>{qualityScore ?? "—"}</strong>
              {qualityStatus ? ` · Status: ${qualityStatus}` : null}
              {!passed && blockingCount > 0 ? ` · ${blockingCount} isu menghalangi` : null}
            </p>
          )}
          {messages.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs list-disc list-inside opacity-90">
              {messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
