"use client";

import React from "react";
import { CleaningAction } from "@/lib/types";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface RecommendedActionsProps {
  actions: CleaningAction[];
  selectedActions: string[];
  onToggle: (actionId: string) => void;
}

export default function RecommendedActions({
  actions,
  selectedActions,
  onToggle,
}: RecommendedActionsProps) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/80 p-5 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Recommended Actions</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select cleaning actions to preview changes before applying.
        </p>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center pt-1">
              <input
                type="checkbox"
                id={`action-${action.id}`}
                checked={selectedActions.includes(action.id)}
                onChange={() => onToggle(action.id)}
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex-1">
              <label htmlFor={`action-${action.id}`} className="cursor-pointer">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{action.description}</p>
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Affected cells: <span className="font-semibold">{action.affected_cells}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Affected rows: <span className="font-semibold">{action.affected_rows}</span>
                </span>
                <div className="flex items-center gap-1">
                  {action.safe_to_apply ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">Safe</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="font-semibold text-amber-600">Review needed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
