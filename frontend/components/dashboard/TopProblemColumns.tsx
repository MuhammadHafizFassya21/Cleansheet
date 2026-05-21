"use client";

import React from "react";

interface TopProblemColumnsProps {
  columns: string[];
}

export default function TopProblemColumns({ columns }: TopProblemColumnsProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/70 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Top Problem Columns</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Kolom mana yang paling sering terdeteksi masalah.</p>
        </div>
      </div>

      {columns.length ? (
        <div className="flex flex-wrap gap-2">
          {columns.map((column) => (
            <span key={column} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
              {column}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada kolom bermasalah yang terdeteksi.</p>
      )}
    </div>
  );
}
