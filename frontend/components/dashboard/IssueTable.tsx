"use client";

import React, { useMemo, useState } from "react";
import { DataQualityIssue, IssueSeverity, IssueType } from "@/lib/types";
import { Filter, ArrowUpDown } from "lucide-react";

interface IssueTableProps {
  issues: DataQualityIssue[];
}
const severityBadge = (severity: IssueSeverity) => {
  if (severity === "critical") return "bg-rose-100 text-rose-700";
  if (severity === "warning") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
};

const typeBadge = (type: IssueType) => {
  const map: Record<IssueType, string> = {
    duplicate: "bg-sky-100 text-sky-700",
    missing_value: "bg-violet-100 text-violet-700",
    whitespace: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    strange_character: "bg-fuchsia-100 text-fuchsia-700",
    invalid_email: "bg-cyan-100 text-cyan-700",
    invalid_phone: "bg-emerald-100 text-emerald-700",
    suspicious_negative_number: "bg-rose-100 text-rose-700",
  };
  return map[type];
};

export default function IssueTable({ issues }: IssueTableProps) {
  const [severityFilter, setSeverityFilter] = useState<"all" | IssueSeverity>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | IssueType>("all");

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
      if (typeFilter !== "all" && issue.type !== typeFilter) return false;
      return true;
    });
  }, [issues, severityFilter, typeFilter]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Tabel Isu</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Filter dan tinjau isu berdasarkan tingkat keparahan dan tipe.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            Keparahan:
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value as "all" | IssueSeverity)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-colors focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {severityLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpDown className="h-4 w-4" />
            Tipe:
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | IssueType)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-colors focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {typeLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 uppercase tracking-[0.16em]">
              <th className="px-4 py-3">Keparahan</th>
              <th className="px-4 py-3">Tipe</th>
              <th className="px-4 py-3">Kolom</th>
              <th className="px-4 py-3">Baris</th>
              <th className="px-4 py-3">Nilai</th>
              <th className="px-4 py-3">Pesan</th>
              <th className="px-4 py-3">Saran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Tidak ada isu yang cocok dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${severityBadge(issue.severity)}`}>
                      {severityLabel(issue.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${typeBadge(issue.type)}`}>
                      {typeLabel(issue.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{issue.column || "-"}</td>
                  <td className="px-4 py-3">{issue.row_index ?? "-"}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-slate-700 dark:text-slate-200">{issue.value ?? "-"}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{issue.message}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{issue.recommendation}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
