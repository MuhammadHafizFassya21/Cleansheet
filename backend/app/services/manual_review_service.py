import json
import re
import uuid
from typing import Any, Optional

import pandas as pd

from ..models.issue import DataQualityIssue
from ..models.manual_review import (
    ManualEditRequest,
    ManualReviewApplyResponse,
    ManualReviewIssue,
    ManualValidationResult,
)
from ..services import cleaning_engine, quality_engine


ALLOWED_MANUAL_REVIEW_TYPES = {
    "invalid_email",
    "invalid_phone",
    "suspicious_negative_number",
}


def filter_manual_review_issue_types(issues: list[DataQualityIssue]) -> list[DataQualityIssue]:
    return [i for i in issues if i.type in ALLOWED_MANUAL_REVIEW_TYPES]


def _safe_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    return str(val)


def get_manual_review_issues(df: pd.DataFrame, issues: list[DataQualityIssue]) -> list[ManualReviewIssue]:
    filtered = filter_manual_review_issue_types(issues)

    manual_issues: list[ManualReviewIssue] = []
    for iss in filtered:
        manual_issues.append(
            ManualReviewIssue(
                id=iss.id,
                type=iss.type,
                severity=iss.severity,
                row_index=int(iss.row_index or 0),
                column=str(iss.column or ""),
                current_value=_safe_str(iss.value),
                message=iss.message,
                recommendation=iss.recommendation,
                review_status="pending",
            )
        )

    return manual_issues


EMAIL_REGEX = quality_engine.EMAIL_REGEX


def _is_valid_email(value: str) -> bool:
    if not value:
        return False
    return bool(EMAIL_REGEX.match(value.strip()))


def _normalize_phone_for_validation(value: str) -> str:
    # Remove spaces/hyphens/dots, keep leading + if present
    normalized = re.sub(r"[\s\-\.]+", "", value or "")
    return normalized


def _is_valid_indonesian_phone(value: str) -> bool:
    # Reuse logic from quality_engine (private there, so we copy same behavior)
    if not value:
        return False

    normalized = _normalize_phone_for_validation(value)
    if not normalized:
        return False

    if re.search(r"[A-Za-z]", normalized):
        return False

    if normalized.startswith("+62"):
        digits = normalized[3:]
        return digits.isdigit() and 8 <= len(digits) <= 13
    if normalized.startswith("62"):
        digits = normalized[2:]
        return digits.isdigit() and 8 <= len(digits) <= 13
    if normalized.startswith("08"):
        digits = normalized[2:]
        return digits.isdigit() and 8 <= len(digits) <= 12
    return False


def validate_manual_value(column: str, value: Optional[str], issue_type: str) -> ManualValidationResult:
    row_index = -1  # placeholder; router will override
    str_val = value if value is not None else None

    if issue_type == "invalid_email":
        ok = bool(str_val) and _is_valid_email(str_val)
        if ok:
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=True,
                issue_type=None,
                message="Value is valid.",
            )
        return ManualValidationResult(
            row_index=row_index,
            column=column,
            value=str_val,
            is_valid=False,
            issue_type="invalid_email",
            message="Email format is still invalid.",
        )

    if issue_type == "invalid_phone":
        ok = bool(str_val) and _is_valid_indonesian_phone(str_val)
        if ok:
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=True,
                issue_type=None,
                message="Value is valid.",
            )
        return ManualValidationResult(
            row_index=row_index,
            column=column,
            value=str_val,
            is_valid=False,
            issue_type="invalid_phone",
            message="Phone format is still invalid.",
        )

    if issue_type == "suspicious_negative_number":
        # Per MVP: negative remains suspicious unless user marks as valid.
        if str_val is None or (isinstance(str_val, str) and not str_val.strip()):
            # empty -> invalid as value for this specific issue
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=False,
                issue_type="suspicious_negative_number",
                message="Value is still suspicious.",
            )
        try:
            num = float(str_val)
        except (ValueError, TypeError):
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=False,
                issue_type="suspicious_negative_number",
                message="Value is still suspicious.",
            )

        if num >= 0:
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=True,
                issue_type=None,
                message="Value is valid.",
            )

        # keep warning state; user can mark as valid via apply
        return ManualValidationResult(
            row_index=row_index,
            column=column,
            value=str_val,
            is_valid=False,
            issue_type="suspicious_negative_number",
            message="Negative number is still suspicious until marked as valid.",
        )

    return ManualValidationResult(
        row_index=row_index,
        column=column,
        value=str_val,
        is_valid=False,
        issue_type=issue_type,
        message="Unsupported issue type.",
    )


def apply_manual_edits(df: pd.DataFrame, edits: list[ManualEditRequest]) -> pd.DataFrame:
    updated = df.copy()

    for e in edits:
        # row_index from quality_engine/model is 1-based; pandas index may not match.
        # We assume parser_service.read_csv_file keeps default RangeIndex starting at 0.
        # So convert row_index=1..N to df index 0..N-1.
        df_idx = int(e.row_index) - 1
        if df_idx < 0 or df_idx >= len(updated):
            continue

        col = e.column
        if col not in updated.columns:
            continue

        updated.at[updated.index[df_idx], col] = e.new_value

    return updated


def mark_issue_as_valid(issue_id: str) -> str:
    # MVP no persistence; router uses marked_valid_issues list.
    return issue_id


def generate_manual_review_csv(df: pd.DataFrame) -> bytes:
    return cleaning_engine.dataframe_to_csv_bytes(df)

