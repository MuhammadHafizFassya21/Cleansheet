import json
import uuid
import logging

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse

from ..models.cleaning import CleaningPreviewResponse, CleaningApplyResponse
from ..services import parser_service, quality_engine, cleaning_engine, dataset_store
from ..services import quality_gate_service
from ..services.file_store import save_cleaned_csv, get_cleaned_csv

router = APIRouter()
logger = logging.getLogger(__name__)


def _load_dataframe(file: UploadFile | None, dataset_id: str | None):
    if dataset_id:
        stored = dataset_store.get_dataset(dataset_id)
        if not stored:
            raise HTTPException(status_code=404, detail="Dataset not found or expired.")
        return stored["df"], stored.get("file_name", "dataset.csv"), dataset_id

    if not file:
        raise HTTPException(status_code=400, detail="Either file or dataset_id must be provided.")

    try:
        contents = file.file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read file.")

    file_size = len(contents)
    file_name = file.filename or "dataset.csv"
    parser_service.validate_data_file(file, file_size)

    df = parser_service.read_data_file(contents, file_name)
    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty.")

    new_id = f"ds_{uuid.uuid4().hex[:8]}"
    dataset_store.save_dataset(df, file_name, stage="uploaded", dataset_id=new_id)
    return df, file_name, new_id


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


@router.post("/preview", response_model=CleaningPreviewResponse)
def cleaning_preview(
    file: UploadFile = File(None),
    dataset_id: str = Form(None),
    selected_actions: str = Form(default="[]"),
):
    df, _, source_dataset_id = _load_dataframe(file, dataset_id)

    analysis = quality_engine.analyze_dataframe(df, source_dataset_id)
    recommended_actions = cleaning_engine.get_cleaning_recommendations(df, analysis.issues)

    selected_actions_list = _parse_selected_actions(selected_actions)
    valid_action_ids = {action.id for action in recommended_actions}
    selected_actions_list = [a for a in selected_actions_list if a in valid_action_ids]

    preview_changes = []
    total_preview_changes = 0
    is_already_clean = (
        len(recommended_actions) == 0
        or all(a.affected_cells == 0 for a in recommended_actions)
    )

    if selected_actions_list:
        preview_changes, total_preview_changes = cleaning_engine.generate_cleaning_preview(
            df, selected_actions_list, limit=100
        )
        if total_preview_changes == 0 and not is_already_clean:
            is_already_clean = True

    return CleaningPreviewResponse(
        dataset_id=source_dataset_id,
        recommended_actions=recommended_actions,
        selected_actions=selected_actions_list,
        preview_changes=preview_changes,
        preview_limit=100,
        total_preview_changes=total_preview_changes,
        is_already_clean=is_already_clean,
    )


@router.post("/apply", response_model=CleaningApplyResponse)
def cleaning_apply(
    file: UploadFile = File(None),
    dataset_id: str = Form(None),
    selected_actions: str = Form(default="[]"),
):
    df, original_name, source_dataset_id = _load_dataframe(file, dataset_id)

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
    except Exception:
        logger.exception("Unexpected error while applying cleaning actions")
        raise HTTPException(status_code=500, detail="Internal error while applying cleaning actions.")

    cleaned_file_name = f"cleaned_{original_name}"

    final_df, gate = quality_gate_service.run_quality_gate(
        cleaned_df, apply_safety_net=True
    )

    cleaned_dataset_id = dataset_store.save_dataset(
        final_df,
        cleaned_file_name,
        stage="auto_cleaned",
    )

    manual_issues = gate.manual_issues
    remaining_issue_types = list({issue.type for issue in manual_issues})

    download_id = ""
    if gate.passed:
        try:
            csv_bytes = cleaning_engine.dataframe_to_csv_bytes(final_df)
            download_id = save_cleaned_csv(csv_bytes, cleaned_file_name)
        except Exception:
            logger.exception("Unexpected error while converting cleaned dataframe to CSV")
            raise HTTPException(status_code=500, detail="Internal error while generating cleaned CSV.")

    return CleaningApplyResponse(
        dataset_id=source_dataset_id,
        cleaned_dataset_id=cleaned_dataset_id,
        selected_actions=actions_applied,
        cleaned_file_name=cleaned_file_name,
        original_row_count=original_row_count,
        cleaned_row_count=cleaned_row_count,
        rows_removed=rows_removed,
        cells_modified=cells_modified,
        actions_applied=actions_applied,
        download_ready=gate.passed and bool(download_id),
        download_id=download_id or "",
        has_manual_review_issues=gate.manual_review_count > 0,
        remaining_manual_review_count=gate.manual_review_count,
        remaining_manual_review_issue_types=remaining_issue_types,
        quality_gate_passed=gate.passed,
        quality_score=gate.quality_score,
        quality_status=gate.status,
        blocking_issue_count=gate.blocking_issue_count,
        gate_messages=gate.messages,
    )


@router.get("/download/{download_id}")
def download_cleaned_csv(download_id: str):
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
