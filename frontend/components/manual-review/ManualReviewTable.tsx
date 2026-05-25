"use client";

import React, { useMemo, useState } from "react";
import { ManualReviewIssue, ManualValidationResult } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  invalid_email: "Email",
  invalid_phone: "Telepon",
  suspicious_negative_number: "Angka negatif",
  strange_character: "Karakter aneh",
};

const TYPE_COLORS: Record<string, string> = {
  invalid_email: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  invalid_phone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  suspicious_negative_number: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  strange_character: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
};

type Props = {
  issues: ManualReviewIssue[];
  draftEdits: Record<string, string>;
  validated: Record<string, ManualValidationResult | null>;
  validateLoadingId: string | null;
  markedValidIssues: Record<string, boolean>;
  onEditChange: (issueId: string, newValue: string) => void;
  onValidate: (issue: ManualReviewIssue) => void;
  onMarkValid: (issue: ManualReviewIssue) => void;
};

export default function ManualReviewTable({
  issues,
  draftEdits,
  validated,
  validateLoadingId,
  markedValidIssues,
  onEditChange,
  onValidate,
  onMarkValid,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.type] = (counts[issue.type] || 0) + 1;
    }
    return counts;
  }, [issues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((issue) => {
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      if (!q) return true;
      const val = (draftEdits[issue.id] ?? issue.current_value ?? "").toLowerCase();
      return (
        issue.column.toLowerCase().includes(q) ||
        val.includes(q) ||
        String(issue.row_index).includes(q)
      );
    });
  }, [issues, typeFilter, search, draftEdits]);

  if (!issues.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Menampilkan <strong>{filtered.length}</strong> dari{" "}
          <strong>{issues.length}</strong> sel bermasalah (hanya data yang perlu ditinjau manual).
        </p>
        <input
          type="search"
          placeholder="Cari baris, kolom, nilai…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            typeFilter === "all"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          Semua ({issues.length})
        </button>
        {Object.entries(typeCounts).map(([type, count]) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              typeFilter === type
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : TYPE_COLORS[type] || "bg-slate-100 text-slate-700"
            }`}
          >
            {TYPE_LABELS[type] || type} ({count})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <th className="px-4 py-3 w-16">Baris</th>
              <th className="px-4 py-3 w-32">Kolom</th>
              <th className="px-4 py-3 w-28">Jenis</th>
              <th className="px-4 py-3">Nilai saat ini → perbaikan</th>
              <th className="px-4 py-3 w-48 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Tidak ada isu untuk filter ini.
                </td>
              </tr>
            ) : (
              filtered.map((issue) => {
                const value = draftEdits[issue.id] ?? issue.current_value ?? "";
                const valRes = validated[issue.id];
                const marked = markedValidIssues[issue.id] || markedValidIssues[issue.stable_key];
                const isFixed = valRes?.is_valid === true;

                return (
                  <tr
                    key={issue.id}
                    className={
                      marked
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                        : isFixed
                        ? "bg-sky-50/40 dark:bg-sky-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs">{issue.row_index}</td>
                    <td className="px-4 py-3 font-medium">{issue.column}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          TYPE_COLORS[issue.type] || ""
                        }`}
                      >
                        {TYPE_LABELS[issue.type] || issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={value}
                        disabled={marked}
                        onChange={(e) => onEditChange(issue.id, e.target.value)}
                        className="w-full min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                        placeholder="Perbaiki nilai…"
                      />
                      {valRes && (
                        <p
                          className={`mt-1 text-xs ${
                            valRes.is_valid ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {valRes.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          disabled={marked || validateLoadingId === issue.id}
                          onClick={() => onValidate(issue)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700"
                        >
                          {validateLoadingId === issue.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Validasi"
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={marked}
                          onClick={() => onMarkValid(issue)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {marked ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Valid
                            </>
                          ) : (
                            "Tandai valid"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
