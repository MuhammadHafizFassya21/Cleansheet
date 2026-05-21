from pydantic import BaseModel


class AIInsightRequest(BaseModel):
    dataset_id: str
    row_count: int = 0
    column_count: int = 0
    quality_score: int
    status: str
    issue_summary: dict
    top_problem_columns: list[str]
    recommended_actions: list[dict] | None = None


class AIInsightResponse(BaseModel):
    dataset_id: str
    summary: str
    biggest_risks: list[str]
    priority_fixes: list[str]
    readiness_status: str
    confidence_note: str
