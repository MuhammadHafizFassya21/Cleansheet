import React from "react";
import { CleaningAction } from "@/lib/types";

function badgeClasses(safeToApply: boolean) {
  return safeToApply
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200";
}

export default function ReportRecommendations({ actions }: { actions: CleaningAction[] }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">Rekomendasi Aksi Pembersihan</p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
        Aksi yang disarankan oleh cleaning engine. Terapkan dengan aman di halaman Bersihkan.
      </p>

      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{action.label}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {action.description}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses(
                  action.safe_to_apply
                )}`}
              >
                {action.safe_to_apply ? "Aman" : "Perlu ditinjau"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
