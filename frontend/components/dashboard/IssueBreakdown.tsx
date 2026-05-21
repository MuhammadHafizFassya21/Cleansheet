"use client";

import React from "react";
import { IssueSummary } from "@/lib/types";

interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

interface IssueBreakdownProps {
  summary: IssueSummary;
}

export default function IssueBreakdown({ summary }: IssueBreakdownProps) {
  const items: BreakdownItem[] = [
    { label: "Duplikat", value: summary.duplicate_count, color: "bg-emerald-500" },
    { label: "Nilai kosong", value: summary.missing_value_count, color: "bg-amber-500" },
    { label: "Whitespace", value: summary.whitespace_count, color: "bg-slate-500" },
    { label: "Karakter aneh", value: summary.strange_character_count, color: "bg-violet-500" },
    { label: "Email tidak valid", value: summary.invalid_email_count, color: "bg-sky-500" },
    { label: "Telepon tidak valid", value: summary.invalid_phone_count, color: "bg-cyan-500" },
  ];

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70 p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Perbandingan Jenis Isu</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Lihat perbandingan jumlah isu per tipe pada dataset Anda.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`${item.color} h-full rounded-full transition-all`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
