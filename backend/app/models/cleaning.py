from pydantic import BaseModel


class CleaningAction(BaseModel):
    id: str
    label: str
    description: str
    issue_types: list[str]
    affected_cells: int
    affected_rows: int
    safe_to_apply: bool


# PERUBAHAN untuk backend/app/models/cleaning.py
# GANTI class CleaningApplyResponse dengan:

class CleaningApplyResponse(BaseModel):
    dataset_id: str
    cleaned_dataset_id: str  # NEW - dataset ID untuk manual review
    selected_actions: list[str]
    cleaned_file_name: str
    original_row_count: int
    cleaned_row_count: int
    rows_removed: int
    cells_modified: int
    actions_applied: list[str]
    download_ready: bool
    download_id: str
    has_manual_review_issues: bool  # NEW - ada issue untuk manual review?
    remaining_manual_review_count: int  # NEW - berapa banyak?
    remaining_manual_review_issue_types: list[str]  # NEW - tipe issue apa saja?


class CleaningSummary(BaseModel):
    original_row_count: int
    cleaned_row_count: int
    rows_removed: int
    cells_modified: int
    actions_applied: list[str]


class CleaningPreviewChange(BaseModel):
    row_index: int | None
    column: str | None
    original_value: str | None
    cleaned_value: str | None
    action_id: str
    message: str


class CleaningPreviewResponse(BaseModel):
    dataset_id: str
    recommended_actions: list[CleaningAction]
    selected_actions: list[str]
    preview_changes: list[CleaningPreviewChange]
    preview_limit: int
    total_preview_changes: int
