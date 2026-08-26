import json
import uuid
import logging
from typing import Any

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Path

from ..models.manual_review import (
    ManualReviewIssuesResponse,
    ManualEditRequest,
    ManualValidateRequest,
    ManualValidationResult,
    ManualReviewApplyResponse,
)
from ..services import parser_service, manual_review_service, dataset_store, quality_gate_service
from ..services.file_store import save_cleaned_csv

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/issues", response_model=ManualReviewIssuesResponse)
def get_issues_from_file(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read file.")

    file_name = file.filename or "dataset.csv"
    parser_service.validate_data_file(file, len(contents))

    try:
        df = parser_service.read_data_file(contents, file_name)
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to parse file.")

    dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
    manual_issues = manual_review_service.get_manual_review_issues(df)

    dataset_store.save_dataset(
        df,
        file_name,
        stage="uploaded",
        metadata={"source": "manual_review_upload"},
        dataset_id=dataset_id,
    )

    return ManualReviewIssuesResponse(
        dataset_id=dataset_id,
        manual_review_issues=manual_issues,
        total=len(manual_issues),
    )


@router.get("/issues/{dataset_id}", response_model=ManualReviewIssuesResponse)
def get_issues_from_store(dataset_id: str = Path(...)):
    stored = dataset_store.get_dataset(dataset_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Dataset not found or expired.")

    df = stored["df"]
    manual_issues = manual_review_service.get_manual_review_issues(df)

    return ManualReviewIssuesResponse(
        dataset_id=dataset_id,
        manual_review_issues=manual_issues,
        total=len(manual_issues),
    )


@router.post("/validate", response_model=ManualValidationResult)
def validate_manual_edit(request: ManualValidateRequest):
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


def _resolve_acknowledged_keys(
    marked_valid_list: list,
    pending_issues: list,
) -> set[str]:
    """Accept stable_key or legacy issue id."""
    keys: set[str] = set()
    id_to_stable = {iss.id: iss.stable_key for iss in pending_issues}
    stable_set = {iss.stable_key for iss in pending_issues}

    for item in marked_valid_list:
        s = str(item)
        if s in stable_set:
            keys.add(s)
        elif s in id_to_stable:
            keys.add(id_to_stable[s])
    return keys


@router.post("/apply", response_model=ManualReviewApplyResponse)
def apply_manual_review(
    dataset_id: str = Form(None),
    file: UploadFile = File(None),
    edits: str = Form(default="[]"),
    marked_valid_issues: str = Form(default="[]"),
):
    df = None
    original_name = "dataset.csv"

    if dataset_id:
        stored = dataset_store.get_dataset(dataset_id)
        if not stored:
            raise HTTPException(status_code=404, detail="Dataset not found or expired.")
        df = stored["df"]
        original_name = stored.get("file_name", "dataset.csv")

    elif file:
        try:
            contents = file.file.read()
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to read file.")

        original_name = file.filename or "dataset.csv"
        parser_service.validate_data_file(file, len(contents))
        try:
            df = parser_service.read_data_file(contents, original_name)
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to parse file.")
        dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
    else:
        raise HTTPException(status_code=400, detail="Either dataset_id or file must be provided.")

    pending_before = manual_review_service.get_manual_review_issues(df)

    edits_list = _parse_json_field(edits)
    marked_valid_list = _parse_json_field(marked_valid_issues)
    acknowledged_keys = _resolve_acknowledged_keys(marked_valid_list, pending_before)

    edit_requests: list[ManualEditRequest] = []
    for ed in edits_list:
        try:
            edit_requests.append(ManualEditRequest(**ed))
        except Exception:
            pass

    edit_cell_keys = {(int(e.row_index), str(e.column)) for e in edit_requests}

    unresolved = quality_gate_service.ensure_all_manual_issues_resolved(
        pending_before, edit_cell_keys, acknowledged_keys
    )
    if unresolved:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Semua isu manual harus diperbaiki atau ditandai valid sebelum menyimpan.",
                "unresolved": unresolved[:20],
            },
        )

    val_errors, _ = quality_gate_service.validate_manual_edits_strict(
        df, edit_requests, pending_before
    )
    if val_errors:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Nilai perbaikan masih tidak valid.",
                "validation_errors": val_errors[:20],
            },
        )

    try:
        edited_df = manual_review_service.apply_manual_edits(df, edit_requests)
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Nilai perbaikan tidak kompatibel dengan tipe kolom.",
                "validation_errors": [str(exc)],
            },
        )

    final_df, gate = quality_gate_service.run_quality_gate(
        edited_df,
        acknowledged_issue_keys=acknowledged_keys,
        apply_safety_net=True,
    )

    if gate.manual_review_count > 0:
        # Get only manual issues that are blocking
        from ..services.quality_gate_service import BLOCKING_MANUAL_TYPES
        blocking_summary = [
            f"Baris {i.row_index}, kolom {i.column} ({i.type}): {i.message}"
            for i in gate.blocking_issues if i.type in BLOCKING_MANUAL_TYPES
        ][:15]
        
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Dataset belum lulus pemeriksaan kualitas final untuk isu manual. Tidak ada file yang diekspor.",
                "gate_messages": gate.messages,
                "blocking_issues": blocking_summary,
                "remaining_issues_count": gate.manual_review_count,
            },
        )

    try:
        csv_bytes = manual_review_service.generate_manual_review_csv(final_df)
    except Exception:
        logger.exception("Failed to generate manual review CSV.")
        raise HTTPException(status_code=500, detail="Error generating final CSV.")

    final_file_name = f"manual_clean_{original_name}"
    download_id = save_cleaned_csv(csv_bytes, final_file_name)

    final_dataset_id = f"ds_final_{uuid.uuid4().hex[:12]}"
    dataset_store.save_dataset(
        final_df,
        final_file_name,
        stage="manually_reviewed",
        metadata={
            "source": "manual_review_apply",
            "quality_gate": "passed",
            "acknowledged_issue_keys": sorted(acknowledged_keys),
        },
        dataset_id=final_dataset_id,
    )

    return ManualReviewApplyResponse(
        dataset_id=dataset_id,
        final_dataset_id=final_dataset_id,
        total_review_issues=len(pending_before),
        fixed_count=len(edit_requests),
        marked_valid_count=len(acknowledged_keys),
        remaining_issues_count=0,
        download_ready=True,
        download_id=download_id,
        quality_gate_passed=True,
        quality_score=gate.quality_score,
        quality_status=gate.status,
        gate_messages=gate.messages,
    )
