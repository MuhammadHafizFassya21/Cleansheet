import type { DataQualityAnalysisResponse } from "@/lib/types";

const STORAGE_KEY = "cleansheet_workflow";

export type WorkflowStage =
  | "idle"
  | "uploaded"
  | "analyzed"
  | "cleaned"
  | "manual_reviewed";

export type WorkflowState = {
  datasetId: string | null;
  fileName: string | null;
  stage: WorkflowStage;
  analysis: DataQualityAnalysisResponse | null;
  cleanedDatasetId: string | null;
  finalDatasetId: string | null;
  downloadId: string | null;
};

const defaultState: WorkflowState = {
  datasetId: null,
  fileName: null,
  stage: "idle",
  analysis: null,
  cleanedDatasetId: null,
  finalDatasetId: null,
  downloadId: null,
};

export function getWorkflowState(): WorkflowState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return { ...defaultState };
  }
}

export function saveWorkflowState(partial: Partial<WorkflowState>) {
  if (typeof window === "undefined") return;
  const next = { ...getWorkflowState(), ...partial };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearWorkflowState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getActiveReportDatasetId(): string | null {
  const s = getWorkflowState();
  return s.finalDatasetId || s.cleanedDatasetId || s.datasetId;
}
