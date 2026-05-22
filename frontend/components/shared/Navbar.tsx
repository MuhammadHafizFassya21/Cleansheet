"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Upload, LayoutDashboard, Sparkles, FileText } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/", icon: FileSpreadsheet },
    { name: "Upload", path: "/upload", icon: Upload },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Clean", path: "/clean", icon: Sparkles },
    { name: "Manual Review", path: "/manual-review", icon: Sparkles },
    { name: "Report", path: "/report", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              CleanSheet<span className="text-emerald-500">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-500" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile menu indicator / Helper info */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/MuhammadHafizFassya21/Cleansheet"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors duration-200"
          >
            <span>Repositori GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
