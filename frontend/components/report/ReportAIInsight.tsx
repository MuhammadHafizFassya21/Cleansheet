import React from "react";
import { AIInsightResponse } from "@/lib/types";
import { Sparkles } from "lucide-react";

export default function ReportAIInsight({ insight }: { insight: AIInsightResponse }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Insight AI</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Ringkasan, risiko terbesar, prioritas perbaikan, dan status kesiapan.
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-5 text-sm text-slate-700 dark:text-slate-200">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ringkasan</p>
          <p className="mt-2 leading-relaxed">{insight.summary}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Risiko terbesar</p>
            <ul className="mt-2 space-y-2">
              {insight.biggest_risks.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Prioritas perbaikan</p>
            <ul className="mt-2 space-y-2">
              {insight.priority_fixes.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status kesiapan</p>
            <p className="mt-2 font-semibold">{insight.readiness_status}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Catatan keyakinan</p>
            <p className="mt-2 leading-relaxed">{insight.confidence_note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
