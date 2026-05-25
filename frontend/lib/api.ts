/** Browser dev: same-origin proxy (/api-backend). Server/direct: localhost:8000 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") return "/api-backend";
  return "http://127.0.0.1:8000";
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Permintaan ke API melebihi batas waktu (${timeoutMs / 1000}s). Pastikan backend berjalan di port 8000.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data: any = await response.clone().json();
    if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;

    if (data?.detail && typeof data.detail === "object" && !Array.isArray(data.detail)) {
      const d = data.detail as Record<string, unknown>;
      if (typeof d.message === "string") {
        const parts = [d.message];
        const unresolved = d.unresolved ?? d.validation_errors ?? d.blocking_issues;
        if (Array.isArray(unresolved) && unresolved.length) {
          parts.push(unresolved.slice(0, 5).join("; "));
        }
        return parts.join(" — ");
      }
    }

    if (Array.isArray(data?.detail) && data.detail.length) {
      const first = data.detail[0];
      const msg = typeof first?.msg === "string" ? first.msg : null;
      const loc = Array.isArray(first?.loc) ? first.loc.join(".") : null;
      if (msg && loc) return `${msg} (${loc})`;
      if (msg) return msg;
      try {
        return JSON.stringify(data.detail);
      } catch { }
    }

    if (data?.detail && typeof data.detail === "object") {
      try {
        return JSON.stringify(data.detail);
      } catch { }
    }
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch { }

  try {
    const text = (await response.clone().text())?.trim();
    if (text) return text;
  } catch { }

  const statusBits: string[] = [];
  if (response.status) statusBits.push(`HTTP ${response.status}`);
  if (response.statusText) statusBits.push(response.statusText);
  const statusPart = statusBits.length ? ` (${statusBits.join(" ")})` : "";
  return `${fallback}${statusPart}`;
}

export async function getBackendHealth() {
  const response = await fetchWithTimeout(
    `${getApiBaseUrl()}/health`,
    { cache: "no-store" },
    5000
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Backend health check failed"));
  }

  return response.json();
}

export async function uploadDataFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/upload/`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to upload file"));
  }

  return response.json();
}

/** @deprecated Use uploadDataFile */
export const uploadCsvFile = uploadDataFile;

export async function analyzeDataFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/analyze/`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to analyze file"));
  }

  return response.json();
}

/** @deprecated Use analyzeDataFile */
export const analyzeCsvFile = analyzeDataFile;

export async function analyzeDatasetById(datasetId: string) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/analyze/${datasetId}`, {
    method: "GET",
    cache: "no-store",
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to analyze stored dataset"));
  }

  return response.json();
}

export async function getCleaningPreview(
  file: File | null,
  selectedActions: string[] = [],
  datasetId?: string | null
) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (datasetId) formData.append("dataset_id", datasetId);
  formData.append("selected_actions", JSON.stringify(selectedActions));

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/clean/preview`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to generate cleaning preview."));
  }

  return response.json();
}

export async function applyCleaningActions(
  file: File | null,
  selectedActions: string[],
  datasetId?: string | null
) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (datasetId) formData.append("dataset_id", datasetId);
  formData.append("selected_actions", JSON.stringify(selectedActions));

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/clean/apply`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to apply cleaning actions."));
  }

  return response.json();
}

export async function generateAIInsight(payload: any) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to generate AI insight."));
  }

  return response.json();
}

export function getCleanedCsvDownloadUrl(downloadId: string) {
  return `${getApiBaseUrl()}/api/clean/download/${downloadId}`;
}

export async function getManualReviewIssues(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/manual-review/issues`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to find manual review issues."));
  }

  return response.json();
}

export async function getManualReviewIssuesByDatasetId(datasetId: string) {
  const response = await fetchWithTimeout(
    `${getApiBaseUrl()}/api/manual-review/issues/${datasetId}`,
    { method: "GET", cache: "no-store" },
    30000
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to find manual review issues for the dataset.")
    );
  }

  return response.json();
}

export async function validateManualValue(payload: {
  row_index: number;
  column: string;
  value: string;
  issue_type: string;
}) {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/manual-review/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to validate value."));
  }

  return response.json();
}

export async function applyManualReviewFixes(
  file: File | null,
  datasetId: string | null,
  edits: { row_index: number; column: string; new_value: string }[],
  markedValidIssues: string[]
) {
  const formData = new FormData();
  if (file) formData.append("file", file);
  if (datasetId) formData.append("dataset_id", datasetId);
  formData.append("edits", JSON.stringify(edits));
  formData.append("marked_valid_issues", JSON.stringify(markedValidIssues));

  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/manual-review/apply`, {
    method: "POST",
    body: formData,
  }, 30000);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to apply manual fixes."));
  }

  return response.json();
}

export function getManualReviewDownloadUrl(downloadId: string) {
  return getCleanedCsvDownloadUrl(downloadId);
}

export async function generateReportFromDatasetId(datasetId: string) {
  const analysisResult = await analyzeDatasetById(datasetId);
  const previewResult = await getCleaningPreview(null, [], datasetId);

  const insightPayload = {
    dataset_id: analysisResult.dataset_id,
    row_count: analysisResult.row_count ?? 0,
    column_count: analysisResult.column_count ?? 0,
    quality_score: analysisResult.quality_score,
    status: analysisResult.status,
    issue_summary: analysisResult.issue_summary,
    top_problem_columns: analysisResult.top_problem_columns,
    recommended_actions: previewResult.recommended_actions ?? null,
  };

  const insightResult = await generateAIInsight(insightPayload);

  return {
    analysis: analysisResult,
    preview: previewResult,
    insight: insightResult,
  };
}
