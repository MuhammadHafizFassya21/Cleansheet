"use client";

import React from "react";
import { Bell, AlertTriangle, Copy, FileText, Mail, Phone, Layers, Info, AlertCircle } from "lucide-react";
import { IssueSummary } from "@/lib/types";

interface IssueSummaryCardsProps {
  summary: IssueSummary;
}

const summaryItems = (summary: IssueSummary) => [
  {
    title: "Total Issues",
    value: summary.total_issues,
    description: "All identified problems in the dataset.",
    icon: Bell,
    color: "bg-slate-100 text-slate-700",
  },
  {
    title: "Critical Issues",
    value: summary.critical_issues,
    description: "Highest priority issues to fix first.",
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-700",
  },
  {
    title: "Warning Issues",
    value: summary.warning_issues,
    description: "Issues that should be reviewed soon.",
    icon: Layers,
    color: "bg-amber-50 text-amber-700",
  },
  {
    title: "Info Issues",
    value: summary.info_issues,
    description: "Additional issues with lower severity.",
    icon: Info,
    color: "bg-sky-50 text-sky-700",
  },
  {
    title: "Duplicate Issues",
    value: summary.duplicate_count,
    description: "Repeated rows or duplicated records.",
    icon: Copy,
    color: "bg-blue-50 text-blue-700",
  },
  {
    title: "Missing Values",
    value: summary.missing_value_count,
    description: "Cells with empty or missing data.",
    icon: FileText,
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Invalid Emails",
    value: summary.invalid_email_count,
    description: "Email addresses that could not be validated.",
    icon: Mail,
    color: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    title: "Invalid Phones",
    value: summary.invalid_phone_count,
    description: "Phone numbers that do not match expected format.",
    icon: Phone,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Negative Values",
    value: summary.suspicious_negative_number_count,
    description: "Suspicious negative numeric values.",
    icon: AlertCircle,
    color: "bg-rose-50 text-rose-700",
  },
];

export default function IssueSummaryCards({ summary }: IssueSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryItems(summary).map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.title}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{item.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
