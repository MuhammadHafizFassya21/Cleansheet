from typing import Literal, Optional
from pydantic import BaseModel


class ManualReviewIssue(BaseModel):
    id: str
    type: str
    severity: str
    row_index: int
    column: str
    current_value: Optional[str] = None
    message: str
    recommendation: str
    review_status: Literal["pending", "fixed", "marked_valid"] = "pending"


class ManualEditRequest(BaseModel):
    row_index: int
    column: str
    new_value: str


class ManualValidationResult(BaseModel):
    row_index: int
    column: str
    value: Optional[str] = None
    is_valid: bool
    issue_type: Optional[str] = None
    message: str


class ManualReviewApplyResponse(BaseModel):
    dataset_id: str
    total_review_issues: int
    fixed_count: int
    marked_valid_count: int
    remaining_issues_count: int
    download_id: Optional[str] = None
    download_ready: bool

