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
  row_count?: number;
  column_count?: number;
  quality_score: number;
  status: string;
  issue_summary: IssueSummary;
  issues: DataQualityIssue[];
  top_problem_columns: string[];
};

export type CleaningAction = {
  id: string;
  label: string;
  description: string;
  issue_types: string[];
  affected_cells: number;
  affected_rows: number;
  safe_to_apply: boolean;
};

export type CleaningPreviewChange = {
  row_index: number | null;
  column: string | null;
  original_value: string | null;
  cleaned_value: string | null;
  action_id: string;
  message: string;
};

export type CleaningPreviewResponse = {
  dataset_id: string;
  recommended_actions: CleaningAction[];
  selected_actions: string[];
  preview_changes: CleaningPreviewChange[];
  preview_limit: number;
  total_preview_changes: number;
};

export type AIInsightRequest = {
  dataset_id: string;
  row_count: number;
  column_count: number;
  quality_score: number;
  status: string;
  issue_summary: Record<string, number>;
  top_problem_columns: string[];
  recommended_actions: Record<string, any>[] | null;
};

export type AIInsightResponse = {
  dataset_id: string;
  summary: string;
  biggest_risks: string[];
  priority_fixes: string[];
  readiness_status: string;
  confidence_note: string;
};

export type CleaningApplyResponse = {
  dataset_id: string;
  selected_actions: string[];
  cleaned_file_name: string;
  original_row_count: number;
  cleaned_row_count: number;
  rows_removed: number;
  cells_modified: number;
  actions_applied: string[];
  download_ready: boolean;
  download_id: string;
};
