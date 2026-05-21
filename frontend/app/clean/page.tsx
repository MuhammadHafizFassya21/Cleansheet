"use client";

import React from "react";
import { Sparkles, ArrowRight, HelpCircle, Info } from "lucide-react";

export default function CleanPage() {
  const mockFixes = [
    { rule: "Trim Whitespace", desc: "Menghapus spasi di awal dan akhir sel.", status: "Ready" },
    { rule: "Hapus Duplikasi", desc: "Menghapus baris duplikat berdasarkan baris unik.", status: "Ready" },
    { rule: "Normalisasi Nomor Telepon", desc: "Format ke nomor standar internasional (+62/62).", status: "Ready" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="h-7 w-7 text-emerald-500" />
          Bersihkan Data CSV
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Terapkan perbaikan otomatis secara aman ke dalam berkas Anda.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Cleaning Options Panel */}
        <div className="md:col-span-1 rounded-2xl border border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Pilihan Pembersihan
            </h2>
            <div className="space-y-3">
              {mockFixes.map((fix, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    disabled
                    checked
                    className="mt-1 h-3.5 w-3.5 rounded-sm border-slate-300 text-emerald-500 cursor-not-allowed"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {fix.rule}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {fix.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled
            className="w-full mt-6 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-400 cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50"
          >
            Jalankan Pembersihan
          </button>
        </div>

        {/* Before/After Preview Panel */}
        <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/20 p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/40 mb-4">
            <Info className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Pratinjau Sebelum & Sesudah
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm leading-relaxed">
            Perbandingan visual sebelum dan sesudah data dibersihkan akan diimplementasikan pada **Phase 7 — Cleaning and Export**.
          </p>
        </div>
      </div>
    </div>
  );
}
