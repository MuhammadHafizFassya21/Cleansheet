# API Specification

## POST /api/upload

Upload CSV file and return dataset metadata and preview.

Response:
{
  "dataset_id": "ds_123",
  "file_name": "customers.csv",
  "row_count": 1000,
  "column_count": 12,
  "columns": [],
  "preview": []
}

## POST /api/analyze

Analyze uploaded dataset.

Request:
{
  "dataset_id": "ds_123"
}

Response:
{
  "quality_score": 72,
  "status": "Needs Review",
  "total_issues": 548,
  "issues": [],
  "issue_summary": {},
  "ai_summary": "..."
}

## POST /api/clean

Apply selected cleaning actions.

Request:
{
  "dataset_id": "ds_123",
  "actions": [
    "trim_whitespace",
    "remove_duplicates",
    "normalize_phone"
  ]
}

Response:
{
  "cleaning_id": "clean_123",
  "before_after_preview": [],
  "download_url": "/api/download/clean_123"
}

## GET /api/download/{cleaning_id}

Download cleaned CSV file.