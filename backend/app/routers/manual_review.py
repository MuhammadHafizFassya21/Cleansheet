import json
import uuid
import logging
from typing import Any

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Path
from fastapi.responses import StreamingResponse

from ..models.manual_review import (
    ManualReviewIssuesResponse,
    ManualEditRequest,
    ManualValidateRequest,
    ManualValidationResult,
    ManualReviewApplyResponse,
)
from ..services import parser_service, quality_engine, manual_review_service, dataset_store
from ..services.file_store import save_cleaned_csv

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/issues", response_model=ManualReviewIssuesResponse)
async def get_issues_from_file(file: UploadFile = File(...)):
    """Extract manual review issues from a freshly uploaded CSV file."""
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read file.")

    parser_service.validate_csv_file(file, len(contents))

    try:
        df = parser_service.read_csv_file(contents)
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to parse CSV file.")

    dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
    analysis = quality_engine.analyze_dataframe(df, dataset_id)
    
    manual_issues = manual_review_service.get_manual_review_issues(df, analysis.issues)
    
    # Store this dataset so we can apply edits to it
    dataset_store.save_dataset(df, file.filename or "dataset.csv", stage="uploaded", metadata={"dataset_id": dataset_id})

    return ManualReviewIssuesResponse(
        dataset_id=dataset_id,
        manual_review_issues=manual_issues,
        total=len(manual_issues),
    )


@router.get("/issues/{dataset_id}", response_model=ManualReviewIssuesResponse)
async def get_issues_from_store(dataset_id: str = Path(...)):
    """Fetch manual review issues for an already stored dataset (e.g. after auto-cleaning)."""
    stored = dataset_store.get_dataset(dataset_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Dataset not found or expired.")
        
    df = stored["df"]
    analysis = quality_engine.analyze_dataframe(df, dataset_id)
    manual_issues = manual_review_service.get_manual_review_issues(df, analysis.issues)
    
    return ManualReviewIssuesResponse(
        dataset_id=dataset_id,
        manual_review_issues=manual_issues,
        total=len(manual_issues),
    )


@router.post("/validate", response_model=ManualValidationResult)
async def validate_manual_edit(request: ManualValidateRequest):
    """Validate a single manual edit value before applying."""
    return manual_review_service.validate_manual_value(
        column=request.column,
        value=request.value,
        issue_type=request.issue_type,
    )


def _parse_json_field(field_str: str) -> Any:
    if not field_str:
        return []
    try:
        return json.loads(field_str)
    except Exception:
        return []


@router.post("/apply", response_model=ManualReviewApplyResponse)
async def apply_manual_review(
    dataset_id: str = Form(None),
    file: UploadFile = File(None),
    edits: str = Form(default="[]"),
    marked_valid_issues: str = Form(default="[]"),
):
    """
    Apply manual edits to a dataset.
    Supports two modes: dataset_id (already stored) OR file (newly uploaded).
    """
    df = None
    original_name = "dataset.csv"
    
    # Mode A: Stored dataset
    if dataset_id:
        stored = dataset_store.get_dataset(dataset_id)
        if not stored:
            raise HTTPException(status_code=404, detail="Dataset not found or expired.")
        df = stored["df"]
        original_name = stored.get("file_name", "dataset.csv")
    
    # Mode B: File upload
    elif file:
        try:
            contents = await file.read()
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to read file.")
        
        parser_service.validate_csv_file(file, len(contents))
        try:
            df = parser_service.read_csv_file(contents)
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to parse CSV file.")
        
        original_name = file.filename or "dataset.csv"
        dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
    else:
        raise HTTPException(status_code=400, detail="Either dataset_id or file must be provided.")

    # Parse edits and marked_valid
    edits_list = _parse_json_field(edits)
    marked_valid_list = _parse_json_field(marked_valid_issues)
    
    edit_requests = []
    for ed in edits_list:
        try:
            edit_requests.append(ManualEditRequest(**ed))
        except Exception:
            pass

    # Apply edits
    edited_df = manual_review_service.apply_manual_edits(df, edit_requests)
    
    # Re-analyze
    final_dataset_id = f"ds_final_{uuid.uuid4().hex[:8]}"
    analysis = quality_engine.analyze_dataframe(edited_df, final_dataset_id)
    
    # Check remaining issues
    all_manual_issues = manual_review_service.get_manual_review_issues(edited_df, analysis.issues)
    
    # Filter out issues that were marked valid
    remaining_issues = [
        issue for issue in all_manual_issues 
        if issue.id not in marked_valid_list
    ]

    # Generate CSV
    try:
        csv_bytes = manual_review_service.generate_manual_review_csv(edited_df)
    except Exception:
        logger.exception("Failed to generate manual review CSV.")
        raise HTTPException(status_code=500, detail="Error generating final CSV.")
        
    final_file_name = f"manual_clean_{original_name}"
    download_id = save_cleaned_csv(csv_bytes, final_file_name)
    
    # Save the final dataset
    dataset_store.save_dataset(edited_df, final_file_name, stage="manually_reviewed", metadata={"dataset_id": final_dataset_id})

    return ManualReviewApplyResponse(
        dataset_id=dataset_id,
        final_dataset_id=final_dataset_id,
        total_review_issues=len(edits_list) + len(marked_valid_list) + len(remaining_issues),
        fixed_count=len(edits_list),
        marked_valid_count=len(marked_valid_list),
        remaining_issues_count=len(remaining_issues),
        download_ready=True,
        download_id=download_id,
    )
