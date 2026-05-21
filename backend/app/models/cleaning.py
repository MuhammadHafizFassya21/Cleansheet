from pydantic import BaseModel


class CleaningAction(BaseModel):
    id: str
    label: str
    description: str
    issue_types: list[str]
    affected_cells: int
    affected_rows: int
    safe_to_apply: bool


class CleaningApplyResponse(BaseModel):
    dataset_id: str
    selected_actions: list[str]
    cleaned_file_name: str
    original_row_count: int
    cleaned_row_count: int
    rows_removed: int
    cells_modified: int
    actions_applied: list[str]
    download_ready: bool
    download_id: str


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
