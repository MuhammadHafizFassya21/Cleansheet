"use client";

import React, { useState, useRef } from "react";
import { Upload, File, AlertCircle, Check } from "lucide-react";

interface FileUploadBoxProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  error?: string | null;
}

export default function FileUploadBox({
  selectedFile,
  onFileSelect,
  error: parentError,
}: FileUploadBoxProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const error = parentError || localError;

  const validateAndSelectFile = (file: File) => {
    setLocalError(null);
    
    // Check extension (case-insensitive)
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setLocalError("Hanya berkas berekstensi .csv yang didukung.");
      return;
    }
    
    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError("Ukuran berkas melebihi batasan 5 MB.");
      return;
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center min-h-[260px] p-8 text-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
            : selectedFile
            ? "border-emerald-300 bg-white/80 dark:border-emerald-800 dark:bg-slate-900/60"
            : error
            ? "border-rose-300 bg-rose-50/10 dark:border-rose-900/30"
            : "border-slate-200/80 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/60 mb-4 shadow-xs">
              <File className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="h-3.5 w-3.5" />
              <span>Berkas siap diunggah</span>
            </div>
            <button
              type="button"
              onClick={onButtonClick}
              className="mt-5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline decoration-slate-300 hover:decoration-slate-500 transition-colors"
            >
              Ganti Berkas
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Pilih berkas CSV Anda atau seret ke sini
            </p>
            <p className="mt-1.5 text-xs text-slate-400">
              Format yang didukung: .csv (Maksimal 5MB)
            </p>
            <button
              type="button"
              onClick={onButtonClick}
              className="mt-6 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-sm transition-colors duration-200"
            >
              Pilih Berkas
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
