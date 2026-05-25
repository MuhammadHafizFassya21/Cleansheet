"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ManualReviewEmptyState({
  fromCleanFlow = false,
  reportHref,
}: {
  fromCleanFlow?: boolean;
  reportHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-3" />
      <div className="text-base font-bold text-slate-900 dark:text-white">
        {fromCleanFlow ? "Tidak ada isu manual tersisa" : "Tidak ada isu tinjauan manual"}
      </div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {fromCleanFlow
          ? "Dataset hasil pembersihan otomatis tidak memiliki isu yang perlu diedit manual. Anda dapat langsung membuat laporan."
          : "Dataset tidak memiliki isu yang memerlukan tinjauan manual (email, telepon, angka negatif, atau karakter aneh)."}
      </div>
      {reportHref && (
        <Link
          href={reportHref}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Lanjut ke Laporan
        </Link>
      )}
    </div>
  );
}
