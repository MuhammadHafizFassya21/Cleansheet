import React from "react";
import { IssueSummary } from "@/lib/types";

type Props = {
  summary: IssueSummary;
};

const typeLabelMap: Record<string, string> = {
  duplicate_count: "Duplikat",
  missing_value_count: "Nilai kosong",
  whitespace_count: "Whitespace",
  strange_character_count: "Karakter aneh",
  invalid_email_count: "Email tidak valid",
  invalid_phone_count: "Telepon tidak valid",
};

export default function ReportIssueSummary({ summary }: Props) {
  const typeEntries = Object.entries(typeLabelMap).map(([key, label]) => ({
    key,
    label,
    value: (summary as any)[key] as number,
  }));

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Ringkasan Isu</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Kritikal: <span className="font-semibold">{summary.critical_issues}</span> · Peringatan:{" "}
            <span className="font-semibold">{summary.warning_issues}</span> · Info:{" "}
            <span className="font-semibold">{summary.info_issues}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950 dark:border-slate-800 dark:bg-slate-950/30 dark:text-white">
          Total isu: {summary.total_issues}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {typeEntries.map((entry) => (
          <div
            key={entry.key}
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30"
          >
            <p className="text-xs text-slate-600 dark:text-slate-300">{entry.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{entry.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
