const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function getBackendHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Backend health check failed");
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
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Failed to upload CSV file");
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
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Failed to analyze CSV file");
  }

  return response.json();
}

export async function getCleaningPreview(file: File, selectedActions: string[] = []) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("selected_actions", JSON.stringify(selectedActions));

  const response = await fetch(`${API_BASE_URL}/api/clean/preview`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "Unable to generate cleaning preview.");
  }

  return response.json();
}

