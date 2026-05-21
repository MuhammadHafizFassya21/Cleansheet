import React from "react";

function getScoreLabel(score: number) {
  if (score >= 85) return { label: "Good", tone: "emerald" };
  if (score >= 70) return { label: "Needs Review", tone: "amber" };
  if (score >= 50) return { label: "Poor", tone: "orange" };
  return { label: "Critical", tone: "rose" };
}

export default function ReportQualitySection({ score }: { score: number }) {
  const meta = getScoreLabel(score);
  const progress = Math.max(0, Math.min(100, score));

  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    orange: "bg-orange-500",
    rose: "bg-rose-500",
  };

  const caption =
    score >= 85
      ? "Dataset terlihat sehat dengan isu minor."
      : score >= 70
        ? "Ada beberapa isu yang perlu ditinjau sebelum analisis."
        : score >= 50
          ? "Banyak isu bisa memengaruhi hasil analisis."
          : "Dataset belum siap. Perbaiki isu kritikal terlebih dahulu.";

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-white">Skor Kualitas</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{caption}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-950 dark:text-white">{score}/100</p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{meta.label}</p>
        </div>
      </div>

      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full ${toneMap[meta.tone]}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
