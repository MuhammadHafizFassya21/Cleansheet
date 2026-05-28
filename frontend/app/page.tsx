"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  Lock,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";
import { getApiBaseUrl, getBackendHealth } from "@/lib/api";
import { BackendHealth } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";

const featureCards = [
  {
    title: "Duplicate Detection",
    description: "Mendeteksi baris berulang dan data duplikat.",
    icon: Database,
  },
  {
    title: "Missing Value Detection",
    description: "Mendeteksi nilai kosong dan placeholder seperti N/A atau NULL.",
    icon: ShieldAlert,
  },
  {
    title: "Whitespace Scanner",
    description: "Menangkap spasi tersembunyi, tab, dan format teks berantakan.",
    icon: CheckCircle2,
  },
  {
    title: "Strange Character Detection",
    description: "Mendeteksi emoji, encoding rusak, simbol non-printable, dan noise.",
    icon: Sparkles,
  },
  {
    title: "Email Validation",
    description: "Menandai format email tidak valid pada kolom penting.",
    icon: FileText,
  },
  {
    title: "Indonesian Phone Validation",
    description: "Memvalidasi nomor telepon Indonesia dan menandai format yang tidak konsisten.",
    icon: Wand2,
  },
  {
    title: "Quality Score",
    description: "Memahami kesiapan dataset dengan skor 0–100.",
    icon: Database,
  },
  {
    title: "Gemini AI Insight",
    description: "Ringkasan risiko dan prioritas perbaikan dengan bahasa sederhana.",
    icon: Sparkles,
  },
  {
    title: "Cleaning Preview",
    description: "Melihat perubahan sebelum–sesudah sebelum menerapkan perbaikan.",
    icon: ShieldAlert,
  },
  {
    title: "Cleaned Data Download",
    description: "Mengunduh dataset yang sudah diperbaiki dan siap digunakan.",
    icon: FileText,
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Upload Dataset",
    description: "Unggah file dan langsung lihat pratinjau baris dan kolom.",
  },
  {
    step: "2",
    title: "Analisis kualitas",
    description: "Deteksi masalah tersembunyi dan dapatkan skor kesiapan.",
  },
  {
    step: "3",
    title: "Buat insight AI",
    description: "Pahami hal yang paling penting dan alasannya.",
  },
  {
    step: "4",
    title: "Pratinjau perbaikan",
    description: "Tinjau perubahan sebelum menerapkan cleaning actions.",
  },
  {
    step: "5",
    title: "Unduh Data Bersih",
    description: "Ekspor dataset yang lebih baik untuk analisis.",
  },
];

export default function HomePage() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        setLoading(true);
        setError(false);
        let lastErr: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const data = await getBackendHealth();
            if (cancelled) return;
            setHealth(data);
            setError(false);
            return;
          } catch (err) {
            lastErr = err;
            if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
          }
        }
        if (cancelled) return;
        console.error(lastErr);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      <StatusBadge health={health} loading={loading} error={error} apiBaseUrl={getApiBaseUrl()} />

      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400/30 via-teal-400/20 to-sky-400/20 blur-3xl" />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-emerald-500/20 to-slate-500/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-14 pb-14 sm:pt-16 sm:pb-20">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl md:text-6xl">
            CleanSheet <span className="text-emerald-500">AI</span>
          </h1>
          <p className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
            Pengecek kualitas data bertenaga AI untuk dataset Anda.
          </p>
          <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Unggah dataset Anda, deteksi masalah kualitas data tersembunyi, pahami risikonya lewat insight AI,
            bersihkan data dengan aman, lalu unduh dataset yang lebih baik.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
            >
              Analisis Dataset
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/clean"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-800 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Bersihkan Dataset
            </Link>
          </div>

        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 dark:border-slate-800/60 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Data yang berantakan menghasilkan keputusan yang tidak akurat.
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Banyak dataset dan spreadsheet terlihat rapi, tapi menyimpan masalah tersembunyi seperti
              duplikat, missing value, email tidak valid, nomor telepon tidak konsisten, spasi berlebih, dan
              karakter aneh.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700 dark:text-slate-200">
              {[
                "duplicate records",
                "missing values",
                "invalid emails",
                "inconsistent phone numbers",
                "extra spaces",
                "strange characters",
                "inconsistent formats",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-8 dark:border-slate-800/60 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Validasi dulu sebelum dipercaya.
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              CleanSheet AI membantu pengguna memvalidasi kualitas data sebelum digunakan. Ia menggabungkan
              pengecekan berbasis aturan dengan penjelasan bertenaga Gemini, sehingga pengguna non-teknis bisa
              memahami apa yang salah, kenapa penting, dan apa yang harus diprioritaskan.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {howItWorks.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{step.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Feature highlights</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Alur demo siap lomba: analisis → jelaskan → bersihkan → ekspor.
            </p>
          </div>
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            Mulai Unggah
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">{feature.title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 via-white/70 to-slate-50/70 p-8 dark:border-emerald-900/30 dark:from-emerald-950/30 dark:via-slate-950/40 dark:to-slate-950/10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900/30 dark:bg-slate-950/40 dark:text-emerald-300">
                <Lock className="h-3.5 w-3.5" />
                Privasi jadi prioritas
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-950 dark:text-white">
                Insight Gemini tanpa mengirim dataset penuh.
              </h2>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                CleanSheet AI tidak mengirim dataset penuh ke Gemini. AI insight dibuat dari ringkasan statistik
                seperti jumlah isu, quality score, kolom paling bermasalah, dan rekomendasi aksi.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-800/60 dark:bg-slate-900/50">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">Siap untuk demo?</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Coba alur lengkap dalam hitungan menit: analisis sample dataset, buat insight AI, bersihkan,
                ekspor, lalu buat ringkasan laporan final.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
                >
                  Mulai Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/report"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  Lihat Halaman Laporan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
