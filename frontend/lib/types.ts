export type BackendHealth = {
  status: string;
  service: string;
  timestamp: string;
};

export type ColumnMetadata = {
  name: string;
  detected_type: "text" | "number" | "date" | "boolean" | "unknown";
  missing_count: number;
  unique_count: number;
};

export type DatasetPreviewResponse = {
  dataset_id: string;
  file_name: string;
  file_size: number;
  row_count: number;
  column_count: number;
  columns: ColumnMetadata[];
  preview: Record<string, string | number | boolean | null>[];
};

export type IssueSeverity = "critical" | "warning" | "info";
export type IssueType =
  | "duplicate"
  | "missing_value"
  | "whitespace"
  | "strange_character"
  | "invalid_email"
  | "invalid_phone";

export type DataQualityIssue = {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  column: string | null;
  row_index: number | null;
  value: string | null;
  message: string;
  recommendation: string;
};

export type IssueSummary = {
  duplicate_count: number;
  missing_value_count: number;
  whitespace_count: number;
  strange_character_count: number;
  invalid_email_count: number;
  invalid_phone_count: number;
  total_issues: number;
  critical_issues: number;
  warning_issues: number;
  info_issues: number;
};

export type DataQualityAnalysisResponse = {
  dataset_id: string;
  quality_score: number;
  status: string;
  issue_summary: IssueSummary;
  issues: DataQualityIssue[];
  top_problem_columns: string[];
};
