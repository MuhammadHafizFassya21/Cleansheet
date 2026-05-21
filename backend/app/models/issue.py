from typing import Literal

from pydantic import BaseModel

IssueSeverity = Literal["critical", "warning", "info"]
IssueType = Literal[
    "duplicate",
    "missing_value",
    "whitespace",
    "strange_character",
    "invalid_email",
    "invalid_phone",
]


class DataQualityIssue(BaseModel):
    id: str
    type: IssueType
    severity: IssueSeverity
    column: str | None
    row_index: int | None
    value: str | None
    message: str
    recommendation: str


class IssueSummary(BaseModel):
    duplicate_count: int
    missing_value_count: int
    whitespace_count: int
    strange_character_count: int
    invalid_email_count: int
    invalid_phone_count: int
    total_issues: int
    critical_issues: int
    warning_issues: int
    info_issues: int


class DataQualityAnalysisResponse(BaseModel):
    dataset_id: str
    quality_score: int
    status: str
    issue_summary: IssueSummary
    issues: list[DataQualityIssue]
    top_problem_columns: list[str]
