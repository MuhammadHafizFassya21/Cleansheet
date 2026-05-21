import React from "react";

type Props = {
  fileName?: string | null;
  rowCount?: number | null;
  columnCount?: number | null;
  status: string;
  totalIssues: number;
};

export default function DatasetOverviewCard({
  fileName,
  rowCount,
  columnCount,
  status,
  totalIssues,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">Ringkasan Dataset</p>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-200">
        {fileName ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400">Berkas</span>
            <span className="font-medium truncate max-w-[60%]">{fileName}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Baris</span>
          <span className="font-semibold">{rowCount ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Kolom</span>
          <span className="font-semibold">{columnCount ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Status kualitas</span>
          <span className="font-semibold">{status}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Total isu</span>
          <span className="font-semibold">{totalIssues}</span>
        </div>
      </div>
    </div>
  );
}
