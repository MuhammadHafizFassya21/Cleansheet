"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getBackendHealth } from "@/lib/api";
import { BackendHealth } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles, Database, FileText } from "lucide-react";

export default function Home() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function checkHealth() {
      try {
        setLoading(true);
        const data = await getBackendHealth();
        setHealth(data);
        setError(false);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="relative overflow-hidden py-12 sm:py-16 lg:py-24">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)] opacity-40">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        {/* API Health Status Badge */}
        <div className="mb-6 animate-fade-in">
          <StatusBadge health={health} loading={loading} error={error} />
        </div>

        {/* Hero Section */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
          CleanSheet <span className="text-emerald-500">AI</span>
        </h1>
        <p className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100 max-w-2xl">
          AI-Powered Data Quality Checker for CSV Files
        </p>
        <p className="mt-4 text-base text-slate-500 dark:text-slate-400 max-w-xl">
          Unggah berkas CSV Anda, deteksi masalah kualitas data yang tersembunyi, pahami dampaknya dengan ringkasan AI, dan unduh data yang bersih dalam hitungan detik.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/upload"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 transition-all duration-200"
          >
            Mulai Unggah CSV
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-slate-200/80 bg-white/50 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-900 transition-all duration-200"
          >
            Pelajari Fitur
          </a>
        </div>

        {/* Features Preview Section */}
        <div id="features" className="mt-20 w-full max-w-5xl">
          <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-16">
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white mb-2">
              Mengapa Menggunakan CleanSheet AI?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-10">
              Ubah spreadsheet yang kotor menjadi data bersih yang siap digunakan untuk analisis.
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {/* Feature 1 */}
              <div className="glow-card flex flex-col justify-between p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-4">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detect Issues</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Menemukan baris duplikat, nilai kosong (missing values), email tidak valid, format telepon tidak standar, karakter asing, serta whitespace bermasalah.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glow-card flex flex-col justify-between p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-4">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Understand Quality</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Dapatkan Data Quality Score secara keseluruhan untuk mengukur kelayakan dataset, lengkap dengan visualisasi kategori kesalahan berdasarkan tingkat keparahan (*severity*).
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glow-card flex flex-col justify-between p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50 sm:col-span-2 lg:col-span-1">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-4">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clean Safely</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Terapkan solusi pembersihan yang disarankan secara otomatis, periksa perbandingan sebelum-dan-sesudah, lalu unduh berkas CSV bersih Anda dengan aman.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
