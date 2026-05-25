"use client";

import React from "react";
import { ManualReviewIssue, ManualValidationResult } from "@/lib/types";

const ISSUE_TYPE_LABELS: Record<string, string> = {
  invalid_email: "Email Tidak Valid",
  invalid_phone: "Nomor HP Tidak Valid",
  suspicious_negative_number: "Angka Negatif Mencurigakan",
  strange_character: "Karakter Aneh",
};

export default function ManualEditCard({
  issue,
  value,
  validatedResult,
  validateLoading,
  markedValid,
  onValueChange,
  onValidate,
  onMarkValid,
}: {
  issue: ManualReviewIssue;
  value: string;
  validatedResult: ManualValidationResult | null;
  validateLoading: boolean;
  markedValid: boolean;
  onValueChange: (v: string) => void;
  onValidate: () => void;
  onMarkValid: () => void;
}) {
  const hasEdited = value !== (issue.current_value ?? "");
  const isFixed = validatedResult?.is_valid === true;
  const isInvalid = validatedResult?.is_valid === false;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        markedValid
          ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20"
          : isFixed
          ? "border-emerald-200 bg-white/60 dark:border-emerald-900 dark:bg-slate-900/40"
          : isInvalid
          ? "border-red-200 bg-white/60 dark:border-red-900 dark:bg-slate-900/40"
          : "border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40"
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {ISSUE_TYPE_LABELS[issue.type] ?? issue.type}
            </span>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Baris: <strong>{issue.row_index}</strong> · Kolom: <strong>{issue.column}</strong>
            </div>
          </div>
          <div
            className={`text-xs font-semibold ${
              markedValid
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {markedValid ? "✓ Ditandai Valid" : "Menunggu"}
          </div>
        </div>

        {/* Message */}
        <div className="text-sm text-slate-700 dark:text-slate-200">
          <p>{issue.message}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            💡 {issue.recommendation}
          </p>
        </div>

        {/* Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Nilai baru
          </label>
          <input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={issue.current_value ?? "Kosong"}
            disabled={markedValid}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          {hasEdited && !validatedResult && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Klik <strong>Validasi</strong> untuk mengecek format, atau langsung klik <strong>Apply Manual Fixes</strong> di bawah.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onValidate}
              disabled={validateLoading || markedValid}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {validateLoading ? "Memvalidasi…" : "Validasi"}
            </button>

            <button
              type="button"
              onClick={onMarkValid}
              disabled={markedValid}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              {markedValid ? "✓ Diabaikan" : "Abaikan (Data Asli Benar)"}
            </button>
          </div>

          {validatedResult && (
            <div
              className={`text-sm font-medium ${
                validatedResult.is_valid
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {validatedResult.is_valid ? "✓ " : "✗ "}
              {validatedResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
