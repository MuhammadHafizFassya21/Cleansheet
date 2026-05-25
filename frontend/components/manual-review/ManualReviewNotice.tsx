"use client";

import React from "react";

export default function ManualReviewNotice() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Tinjauan Manual Diperlukan
      </div>
      <div className="mt-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
        Perbaiki nilai yang salah atau tandai valid hanya jika Anda yakin data benar. CleanSheet tidak
        menebak email, telepon, atau angka negatif mencurigakan secara otomatis.
      </div>
      <div className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
        CSV final hanya dapat diunduh setelah semua isu diselesaikan dan dataset lulus pemeriksaan kualitas
        otomatis.
      </div>
    </div>
  );
}
