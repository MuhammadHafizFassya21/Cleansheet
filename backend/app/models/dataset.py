from pydantic import BaseModel
from typing import List, Dict, Any, Literal

class ColumnMetadata(BaseModel):
    name: str
    detected_type: Literal["text", "number", "date", "boolean", "unknown"]
    missing_count: int
    unique_count: int

class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    file_name: str
    file_size: int
    row_count: int
    column_count: int
    columns: List[ColumnMetadata]
    preview: List[Dict[str, Any]]
    preview_issues: List[Dict[str, Any]] = []
