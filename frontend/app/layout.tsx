import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";

export const metadata: Metadata = {
  title: "CleanSheet AI — AI-Powered CSV Data Quality Checker",
  description: "Deteksi kesalahan tersembunyi pada CSV Anda secara instan dan bersihkan dengan kecerdasan buatan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="flex-grow flex flex-col justify-start">
          {children}
        </main>
        <footer className="border-t border-slate-200/50 bg-white/40 dark:border-slate-800/50 dark:bg-slate-900/40 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p>© {new Date().getFullYear()} CleanSheet AI. Dibuat untuk kualitas data yang lebih baik.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
