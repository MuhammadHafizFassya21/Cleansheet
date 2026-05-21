from pydantic import BaseModel


class CleaningAction(BaseModel):
    id: str
    label: str
    description: str
    issue_types: list[str]
    affected_cells: int
    affected_rows: int
    safe_to_apply: bool


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
