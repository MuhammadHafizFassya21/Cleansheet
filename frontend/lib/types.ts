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
  preview_issues?: DataQualityIssue[];
};

export type IssueSeverity = "critical" | "warning" | "info";
export type IssueType =
  | "duplicate"
  | "missing_value"
  | "whitespace"
  | "strange_character"
  | "invalid_email"
  | "invalid_phone"
  | "suspicious_negative_number";

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
  suspicious_negative_number_count: number;
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
  is_already_clean?: boolean;
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
  cleaned_dataset_id: string;
  selected_actions: string[];
  cleaned_file_name: string;
  original_row_count: number;
  cleaned_row_count: number;
  rows_removed: number;
  cells_modified: number;
  actions_applied: string[];
  download_ready: boolean;
  download_id: string;
  has_manual_review_issues: boolean;
  remaining_manual_review_count: number;
  remaining_manual_review_issue_types: string[];
  quality_gate_passed?: boolean;
  quality_score?: number;
  quality_status?: string;
  blocking_issue_count?: number;
  gate_messages?: string[];
};

// ---------- Manual Review (Phase 11.6) ----------

export type ManualReviewIssue = {
  id: string;
  stable_key: string;
  type:
    | "invalid_email"
    | "invalid_phone"
    | "suspicious_negative_number"
    | "strange_character";
  severity: "critical" | "warning" | "info" | string;
  row_index: number;
  column: string;
  current_value: string | null;
  message: string;
  recommendation: string;
  review_status: "pending" | "fixed" | "marked_valid";
};

export type ManualEditRequest = {
  row_index: number;
  column: string;
  new_value: string;
};

export type ManualValidationResult = {
  row_index: number;
  column: string;
  value: string | null;
  is_valid: boolean;
  issue_type:
    | "invalid_email"
    | "invalid_phone"
    | "suspicious_negative_number"
    | "strange_character"
    | null;
  message: string;
};

export type ManualReviewApplyResponse = {
  dataset_id: string;
  final_dataset_id: string;
  total_review_issues: number;
  fixed_count: number;
  marked_valid_count: number;
  remaining_issues_count: number;
  download_id: string | null;
  download_ready: boolean;
  quality_gate_passed?: boolean;
  quality_score?: number;
  quality_status?: string;
  gate_messages?: string[];
};

