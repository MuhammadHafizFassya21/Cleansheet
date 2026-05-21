"use client";

import React from "react";
import { Trophy, ShieldCheck, AlertTriangle, Sparkles } from "lucide-react";

interface QualityScoreCardProps {
  qualityScore: number;
}

const getScoreDetails = (score: number) => {
  if (score >= 85) {
    return {
      label: "Good",
      barColor: "bg-emerald-500",
      badgeColor: "bg-emerald-50 text-emerald-700",
      icon: Trophy,
      message: "Your dataset looks healthy and ready for use.",
    };
  }

  if (score >= 70) {
    return {
      label: "Needs Review",
      barColor: "bg-amber-500",
      badgeColor: "bg-amber-50 text-amber-700",
      icon: ShieldCheck,
      message: "Your dataset is usable but has some issues to review.",
    };
  }

  if (score >= 50) {
    return {
      label: "Poor",
      barColor: "bg-rose-500",
      badgeColor: "bg-rose-50 text-rose-700",
      icon: AlertTriangle,
      message: "Your dataset has several quality problems that should be fixed.",
    };
  }

  return {
    label: "Critical",
    barColor: "bg-rose-600",
    badgeColor: "bg-rose-100 text-rose-800",
    icon: Sparkles,
    message: "Your dataset has serious issues and is not ready for use.",
  };
};

export default function QualityScoreCard({ qualityScore }: QualityScoreCardProps) {
  const { label, barColor, badgeColor, icon: Icon, message } = getScoreDetails(qualityScore);
  const progress = Math.min(100, Math.max(0, qualityScore));

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Data Quality Score</p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-5xl font-extrabold text-slate-900 dark:text-white">{qualityScore}</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/100</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{message}</p>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold ${badgeColor}`}>
          <Icon className="h-4 w-4" />
          {label}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Score progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
