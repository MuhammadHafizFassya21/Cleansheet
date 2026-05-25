export const SUPPORTED_DATA_EXTENSIONS = [".csv", ".tsv", ".txt", ".xlsx", ".xls"] as const;

export const SUPPORTED_DATA_ACCEPT = SUPPORTED_DATA_EXTENSIONS.join(",");

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function isSupportedDataFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_DATA_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function supportedFormatsLabel(): string {
  return SUPPORTED_DATA_EXTENSIONS.join(", ");
}
