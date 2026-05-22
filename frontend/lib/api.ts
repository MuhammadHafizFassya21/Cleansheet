const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function getErrorMessage(response: Response, fallback: string) {
  // Prefer JSON `{detail: ...}` (FastAPI), fall back to plain text, then status text.
  try {
    const data: any = await response.clone().json();
    if (typeof data?.detail === "string" && data.detail.trim()) return data.detail;

    // FastAPI validation errors typically return `{ detail: [{ loc, msg, type }, ...] }`
    if (Array.isArray(data?.detail) && data.detail.length) {
      const first = data.detail[0];
      const msg = typeof first?.msg === "string" ? first.msg : null;
      const loc = Array.isArray(first?.loc) ? first.loc.join(".") : null;
      if (msg && loc) return `${msg} (${loc})`;
      if (msg) return msg;
      try {
        return JSON.stringify(data.detail);
      } catch {}
    }

    if (data?.detail && typeof data.detail === "object") {
      try {
        return JSON.stringify(data.detail);
      } catch {}
    }
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
  } catch {}

  try {
    const text = (await response.clone().text())?.trim();
    if (text) return text;
  } catch {}

  const statusBits: string[] = [];
  if (response.status) statusBits.push(`HTTP ${response.status}`);
  if (response.statusText) statusBits.push(response.statusText);
  const statusPart = statusBits.length ? ` (${statusBits.join(" ")})` : "";
  return `${fallback}${statusPart}`;
}

export async function getBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Backend health check failed"));
  }

  return response.json();
}

export async function uploadCsvFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to upload CSV file"));
  }

  return response.json();
}

export async function analyzeCsvFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to analyze CSV file"));
  }

  return response.json();
}

export async function getCleaningPreview(
  file: File,
  selectedActions: string[] = []
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("selected_actions", JSON.stringify(selectedActions));

  const response = await fetch(`${API_BASE_URL}/api/clean/preview`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to generate cleaning preview."));
  }

  return response.json();
}

export async function applyCleaningActions(
  file: File,
  selectedActions: string[]
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("selected_actions", JSON.stringify(selectedActions));

  const response = await fetch(`${API_BASE_URL}/api/clean/apply`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await getErrorMessage(response, "Unable to apply cleaning actions.");
    // Useful while debugging: see exact HTTP status + any non-JSON payload.
    console.error("applyCleaningActions failed", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });
    throw new Error(message);
  }

  return response.json();
}

export async function generateAIInsight(payload: any) {
  const response = await fetch(`${API_BASE_URL}/api/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to generate AI insight."));
  }

  return response.json();
}

export function getCleanedCsvDownloadUrl(downloadId: string) {
  return `${API_BASE_URL}/api/clean/download/${downloadId}`;
}

// ---------- Manual Review (Phase 11.6) ----------

export async function getManualReviewIssues(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/manual-review/issues`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to find manual review issues."));
  }

  return response.json();
}

export async function validateManualValue(payload: {
  row_index: number;
  column: string;
  value: string;
  issue_type: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/manual-review/validate`, {
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
  file: File,
  edits: { row_index: number; column: string; new_value: string }[],
  markedValidIssues: string[]
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("edits", JSON.stringify(edits));
  formData.append("marked_valid_issues", JSON.stringify(markedValidIssues));

  const response = await fetch(`${API_BASE_URL}/api/manual-review/apply`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to apply manual fixes."));
  }

  return response.json();
}

// Uses the same in-memory download endpoint as clean/download
export function getManualReviewDownloadUrl(downloadId: string) {
  return getCleanedCsvDownloadUrl(downloadId);
}

