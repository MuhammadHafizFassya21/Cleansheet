import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ReportNextSteps() {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
      <p className="text-sm font-semibold text-slate-950 dark:text-white">Langkah Selanjutnya</p>
      <ol className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {[
          "Tinjau isu kritikal terlebih dahulu.",
          "Terapkan aksi pembersihan yang aman.",
          "Unduh data bersih dari halaman Bersihkan.",
          "Jalankan analisis ulang setelah dibersihkan.",
        ].map((step, idx) => (
          <li key={step} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {idx + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-end">
        <Link
          href="/clean"
          className="inline-flex items-center justify-center rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
        >
          Buka Halaman Bersihkan
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
