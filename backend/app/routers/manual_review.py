import json
import uuid
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, UploadFile, Form, HTTPException

from ..models.issue import DataQualityAnalysisResponse
from ..models.manual_review import (
    ManualEditRequest,
    ManualReviewApplyResponse,
    ManualReviewIssue,
    ManualValidationResult,
)
from ..services import file_store, manual_review_service, parser_service, quality_engine, cleaning_engine, dataset_store
router = APIRouter()


def _parse_json_field(val: str) -> Any:
    if not val:
        return None
    try:
        return json.loads(val)
    except Exception:
        return None


@router.post("/issues")
async def manual_review_issues(file: UploadFile = File(...)):
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

    file_size = len(contents)
    parser_service.validate_csv_file(file, file_size)

    df = parser_service.read_csv_file(contents)

    analysis = quality_engine.analyze_dataframe(df, f"ds_{uuid.uuid4().hex[:8]}")
    manual_issues = manual_review_service.get_manual_review_issues(df, analysis.issues)

    return {
        "dataset_id": analysis.dataset_id,
        "manual_review_issues": [i.dict() for i in manual_issues],
        "total": len(manual_issues),
    }

@router.get("/issues/{dataset_id}")
async def manual_review_issues_by_dataset_id(dataset_id: str):
    """
    Get manual review issues for a dataset from session store.
    Used when coming from Clean page workflow.
    """
    result = dataset_store.get_dataset(dataset_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Dataset not found or expired.")
    
    df, metadata = result
    
    # Re-run analysis on the stored dataframe
    analysis = quality_engine.analyze_dataframe(df, dataset_id)
    
    # Get only manual review issues
    manual_issues = manual_review_service.get_manual_review_issues(df, analysis.issues)
    
    return {
        "dataset_id": dataset_id,
        "stage": metadata.get("stage"),
        "manual_review_issues": [i.dict() for i in manual_issues],
        "total": len(manual_issues),
        "created_at": metadata.get("created_at"),
    }

@router.post("/validate", response_model=ManualValidationResult)
async def manual_review_validate(payload: dict):
    try:
        row_index = int(payload.get("row_index"))
        column = str(payload.get("column"))
        value = payload.get("value")
        issue_type = str(payload.get("issue_type"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid request payload.")

    res = manual_review_service.validate_manual_value(column=column, value=value, issue_type=issue_type)
    res.row_index = row_index
    return res


@router.post("/apply", response_model=ManualReviewApplyResponse)
async def manual_review_apply(
    file: UploadFile = File(None),  # Changed to optional
    edits: str = Form(default="[]"),
    marked_valid_issues: str = Form(default="[]"),
    dataset_id: str = Form(default=""),  # NEW
):
        # MODE A: From Clean page with dataset_id
    if dataset_id:
        result = dataset_store.get_dataset(dataset_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Dataset not found or expired.")
        df, metadata = result
        original_file_name = metadata.get("file_name", "dataset.csv")
    
    # MODE B: Direct upload with file
    elif file:
        try:
            contents = await file.read()
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

        file_size = len(contents)
        parser_service.validate_csv_file(file, file_size)
        df = parser_service.read_csv_file(contents)
        original_file_name = file.filename or "dataset.csv"
    
    else:
        raise HTTPException(status_code=400, detail="Either dataset_id or file must be provided.")

    edits_parsed = _parse_json_field(edits) or []
    marked_parsed = _parse_json_field(marked_valid_issues) or []

    try:
        edits_models = [ManualEditRequest(**e) for e in edits_parsed]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid edits payload.")

    if not isinstance(marked_parsed, list):
        marked_parsed = []

    # Apply edits first
    updated_df = manual_review_service.apply_manual_edits(df, edits_models)

    # Re-run analysis on edited df
    analysis = quality_engine.analyze_dataframe(updated_df, f"ds_{uuid.uuid4().hex[:8]}")
    filtered_issues = manual_review_service.filter_manual_review_issue_types(analysis.issues)

    # Ignore issues marked valid
    remaining = [i for i in filtered_issues if i.id not in set(marked_parsed)]

    fixed_count = 0
    marked_valid_count = 0

    # Determine counts by comparing which issue ids are resolved
    all_filtered_ids = {i.id for i in filtered_issues}
    marked_valid_set = set(marked_parsed)
    marked_valid_count = len(marked_valid_set.intersection(all_filtered_ids))

    remaining_ids = {i.id for i in remaining}
    fixed_count = len(all_filtered_ids.difference(remaining_ids).difference(marked_valid_set))

    remaining_issues_count = len(remaining)

        # NEW: Save final dataframe to dataset store
    final_dataset_id = dataset_store.save_dataset(
        updated_df,
        f"manual_cleaned_{original_file_name}",
        stage="manually_reviewed"
    )
    
    csv_bytes = manual_review_service.generate_manual_review_csv(updated_df)
    download_id = None
    download_ready = True

    # Always generate download for MVP even if issues remain
    download_id = file_store.save_cleaned_csv(csv_bytes, f"manual_cleaned_{original_file_name}")

    return ManualReviewApplyResponse(
        dataset_id=analysis.dataset_id,
        final_dataset_id=final_dataset_id,
        total_review_issues=len(all_filtered_ids),
        fixed_count=fixed_count,
        marked_valid_count=marked_valid_count,
        remaining_issues_count=remaining_issues_count,
        download_id=download_id,
        download_ready=download_ready,
    )

