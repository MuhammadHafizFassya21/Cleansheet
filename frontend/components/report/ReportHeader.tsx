import React from "react";

export default function ReportHeader() {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 dark:border-slate-800/60 dark:bg-slate-900/50">
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
        Laporan Kualitas Data
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        Ringkasan kesiapan dataset, isu yang terdeteksi, insight AI, dan langkah selanjutnya yang disarankan.
      </p>
    </div>
  );
}
