import re
from typing import Any, Optional

import pandas as pd

from ..models.issue import DataQualityIssue
from ..models.manual_review import (
    ManualEditRequest,
    ManualReviewIssue,
    ManualValidationResult,
)
from ..services import cleaning_engine, quality_engine
from ..services.quality_gate_service import issue_stable_key


ALLOWED_MANUAL_REVIEW_TYPES = {
    "invalid_email",
    "invalid_phone",
    "suspicious_negative_number",
    "strange_character",
    "missing_value",
}


def filter_manual_review_issue_types(issues: list[DataQualityIssue]) -> list[DataQualityIssue]:
    return [i for i in issues if i.type in ALLOWED_MANUAL_REVIEW_TYPES]


def count_manual_review_issues(issues: list[DataQualityIssue]) -> int:
    return len(filter_manual_review_issue_types(issues))


def detect_manual_review_issues(df: pd.DataFrame) -> list[DataQualityIssue]:
    """
    Scan the current dataframe and return only cells that still fail
    manual-review rules (invalid email/phone, suspicious negatives, strange chars).
    Does not include auto-fixable issues (whitespace, duplicates, missing placeholders).
    """
    issues: list[DataQualityIssue] = []
    issues.extend(quality_engine.detect_invalid_emails(df))
    issues.extend(quality_engine.detect_invalid_phones(df))
    issues.extend(quality_engine.detect_suspicious_negative_numbers(df))
    issues.extend(quality_engine.detect_strange_characters(df))
    issues.extend(quality_engine.detect_missing_values(df))
    return issues


def _safe_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    if isinstance(val, float) and pd.isna(val):
        return None
    return str(val)


def get_manual_review_issues(df: pd.DataFrame, issues: list[DataQualityIssue] | None = None) -> list[ManualReviewIssue]:
    """
    Build manual-review queue from the live dataframe.
    When `issues` is omitted, re-detects from `df` so post-clean data is accurate.
    """
    source_issues = issues if issues is not None else detect_manual_review_issues(df)
    filtered = filter_manual_review_issue_types(source_issues)

    manual_issues: list[ManualReviewIssue] = []
    for iss in filtered:
        manual_issues.append(
            ManualReviewIssue(
                id=iss.id,
                stable_key=issue_stable_key(iss),
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
    normalized = re.sub(r"[\s\-\.]+", "", value or "")
    return normalized


def _is_valid_indonesian_phone(value: str) -> bool:
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
    row_index = -1
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

    if issue_type == "strange_character":
        if str_val is None or (isinstance(str_val, str) and not str_val.strip()):
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=False,
                issue_type="strange_character",
                message="Value still contains strange characters or is empty.",
            )
        if not quality_engine._has_strange_characters(str_val):
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
            issue_type="strange_character",
            message="Strange characters remain. Edit the value or mark as valid.",
        )

    if issue_type == "suspicious_negative_number":
        if str_val is None or (isinstance(str_val, str) and not str_val.strip()):
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

        return ManualValidationResult(
            row_index=row_index,
            column=column,
            value=str_val,
            is_valid=False,
            issue_type="suspicious_negative_number",
            message="Negative number is still suspicious until marked as valid.",
        )

    if issue_type == "missing_value":
        if str_val is None or not str_val.strip():
            return ManualValidationResult(
                row_index=row_index,
                column=column,
                value=str_val,
                is_valid=False,
                issue_type="missing_value",
                message="Nilai masih kosong. Silakan isi data yang hilang.",
            )
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
        issue_type=issue_type,
        message="Unsupported issue type.",
    )


def coerce_manual_value(series: pd.Series, value: str) -> Any:
    """Convert a manual string edit to the existing column dtype safely."""
    raw = value.strip()
    dtype = series.dtype

    if pd.api.types.is_bool_dtype(dtype):
        normalized = raw.lower()
        if normalized in {"true", "1", "yes", "y", "t"}:
            return True
        if normalized in {"false", "0", "no", "n", "f"}:
            return False
        raise ValueError(f"Nilai '{value}' tidak valid untuk kolom boolean.")

    if pd.api.types.is_integer_dtype(dtype):
        try:
            number = float(raw)
        except (TypeError, ValueError):
            raise ValueError(f"Nilai '{value}' tidak valid untuk kolom integer.")
        if not number.is_integer():
            raise ValueError(f"Nilai '{value}' tidak valid untuk kolom integer.")
        return int(number)

    if pd.api.types.is_float_dtype(dtype):
        try:
            return float(raw)
        except (TypeError, ValueError):
            raise ValueError(f"Nilai '{value}' tidak valid untuk kolom angka.")

    if pd.api.types.is_datetime64_any_dtype(dtype):
        try:
            return pd.to_datetime(raw)
        except (TypeError, ValueError):
            raise ValueError(f"Nilai '{value}' tidak valid untuk kolom tanggal.")

    # Object/string columns remain strings so phone leading zeroes are preserved.
    return value


def apply_manual_edits(df: pd.DataFrame, edits: list[ManualEditRequest]) -> pd.DataFrame:
    updated = df.copy()
    converted_edits: list[tuple[int, str, Any]] = []

    for e in edits:
        # e.row_index was derived from pandas index label + 1
        df_label = int(e.row_index) - 1
        
        if df_label not in updated.index:
            continue

        col = e.column
        if col not in updated.columns:
            continue

        converted_edits.append((df_label, col, coerce_manual_value(updated[col], e.new_value)))

    for df_label, col, value in converted_edits:
        updated.at[df_label, col] = value

    return updated


def mark_issue_as_valid(issue_id: str) -> str:
    return issue_id


def generate_manual_review_csv(df: pd.DataFrame) -> bytes:
    return cleaning_engine.dataframe_to_csv_bytes(df)
