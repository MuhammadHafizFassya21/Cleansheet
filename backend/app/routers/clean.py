import json
import uuid
import logging

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse

from ..models.cleaning import CleaningPreviewResponse, CleaningApplyResponse
from ..services import parser_service, quality_engine, cleaning_engine, dataset_store
from ..services.file_store import save_cleaned_csv, get_cleaned_csv

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/preview", response_model=CleaningPreviewResponse)
async def cleaning_preview(
    file: UploadFile = File(...),
    selected_actions: str = Form(default="[]"),
):
    """
    Generate cleaning recommendations and preview based on uploaded CSV.
    """
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

    file_size = len(contents)
    parser_service.validate_csv_file(file, file_size)

    df = parser_service.read_csv_file(contents)
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    analysis = quality_engine.analyze_dataframe(df, f"ds_{uuid.uuid4().hex[:8]}")
    recommended_actions = cleaning_engine.get_cleaning_recommendations(df, analysis.issues)

    try:
        if isinstance(selected_actions, str):
            selected_actions_list = json.loads(selected_actions)
        else:
            selected_actions_list = selected_actions
    except json.JSONDecodeError:
        selected_actions_list = []

    valid_action_ids = {action.id for action in recommended_actions}
    selected_actions_list = [a for a in selected_actions_list if a in valid_action_ids]

    preview_changes = []
    total_preview_changes = 0

    if selected_actions_list:
        preview_changes, total_preview_changes = cleaning_engine.generate_cleaning_preview(
            df, selected_actions_list, limit=100
        )

    return CleaningPreviewResponse(
        dataset_id=analysis.dataset_id,
        recommended_actions=recommended_actions,
        selected_actions=selected_actions_list,
        preview_changes=preview_changes,
        preview_limit=100,
        total_preview_changes=total_preview_changes,
    )


def _parse_selected_actions(selected_actions: str) -> list[str]:
    if not selected_actions:
        return []
    try:
        parsed = json.loads(selected_actions)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except Exception:
        pass

    if "," in selected_actions:
        return [s.strip() for s in selected_actions.split(",") if s.strip()]

    return [selected_actions.strip()] if selected_actions.strip() else []


@router.post("/apply", response_model=CleaningApplyResponse)
async def cleaning_apply(
    file: UploadFile = File(...),
    selected_actions: str = Form(default="[]"),
):
    """
    Apply selected cleaning actions to uploaded CSV and prepare cleaned CSV for download.
    Also stores the cleaned dataset and returns manual review metadata.
    """
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to apply cleaning actions.")

    file_size = len(contents)
    parser_service.validate_csv_file(file, file_size)

    try:
        df = parser_service.read_csv_file(contents)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to parse CSV file.")

    selected_actions_list = _parse_selected_actions(selected_actions)

    if not selected_actions_list:
        raise HTTPException(status_code=400, detail="No cleaning action selected.")

    try:
        (
            cleaned_df,
            original_row_count,
            cleaned_row_count,
            rows_removed,
            cells_modified,
            actions_applied,
        ) = cleaning_engine.apply_cleaning_actions(df, selected_actions_list)
    except ValueError as e:
        msg = str(e)
        if "Invalid selected cleaning action" in msg:
            raise HTTPException(status_code=400, detail="Invalid selected cleaning action.")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error while applying cleaning actions")
        raise HTTPException(status_code=500, detail="Internal error while applying cleaning actions.")

    original_name = file.filename or "dataset.csv"
    cleaned_file_name = f"cleaned_{original_name}"

    try:
        csv_bytes = cleaning_engine.dataframe_to_csv_bytes(cleaned_df)
    except Exception:
        logger.exception("Unexpected error while converting cleaned dataframe to CSV")
        raise HTTPException(status_code=500, detail="Internal error while generating cleaned CSV.")

    download_id = save_cleaned_csv(csv_bytes, cleaned_file_name)

    # NEW: Save cleaned dataframe to dataset store for manual review
    cleaned_dataset_id = dataset_store.save_dataset(
        cleaned_df,
        file.filename or "dataset.csv",
        stage="auto_cleaned"
    )

    # NEW: Re-run analysis on cleaned dataframe to detect remaining issues
    cleaned_analysis = quality_engine.analyze_dataframe(
        cleaned_df,
        cleaned_dataset_id
    )

    # NEW: Filter manual review issues only
    manual_review_issue_types = {
        "invalid_email",
        "invalid_phone",
        "suspicious_negative_number",
        "strange_character"
    }
    remaining_manual_review_issues = [
        issue for issue in cleaned_analysis.issues
        if issue.type in manual_review_issue_types
    ]
    
    # NEW: Count and collect issue types
    remaining_issue_types = list(set(
        issue.type for issue in remaining_manual_review_issues
    ))
    
    return CleaningApplyResponse(
        dataset_id=f"ds_{uuid.uuid4().hex[:8]}",
        cleaned_dataset_id=cleaned_dataset_id,  # NEW
        selected_actions=actions_applied,
        cleaned_file_name=cleaned_file_name,
        original_row_count=original_row_count,
        cleaned_row_count=cleaned_row_count,
        rows_removed=rows_removed,
        cells_modified=cells_modified,
        actions_applied=actions_applied,
        download_ready=True,
        download_id=download_id,
        has_manual_review_issues=len(remaining_manual_review_issues) > 0,  # NEW
        remaining_manual_review_count=len(remaining_manual_review_issues),  # NEW
        remaining_manual_review_issue_types=remaining_issue_types,  # NEW
    )


@router.get("/download/{download_id}")
async def download_cleaned_csv(download_id: str):
    payload = get_cleaned_csv(download_id)
    if not payload:
        raise HTTPException(status_code=404, detail="Cleaned file not found or expired.")

    csv_bytes: bytes = payload["bytes"]
    file_name: str = payload["file_name"]

    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"',
            "Cache-Control": "no-store",
        },
    )
