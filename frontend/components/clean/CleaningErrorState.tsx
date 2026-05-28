"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface CleaningErrorStateProps {
  message: string;
}

export default function CleaningErrorState({ message }: CleaningErrorStateProps) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center text-slate-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200 mb-6">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-semibold">Unable to prepare cleaning recommendations</h2>
      <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 max-w-xl mx-auto">
        {message}
      </p>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        Please upload a valid data file. Make sure the file is not empty and does not exceed the size limit.
      </p>
    </div>
  );
}
