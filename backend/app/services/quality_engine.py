import re
import uuid
from collections import Counter
from typing import Any

import pandas as pd

from ..models.issue import (
    DataQualityAnalysisResponse,
    DataQualityIssue,
    IssueSummary,
)

EMAIL_COLUMN_KEYWORDS = ("email", "mail", "e-mail")
PHONE_COLUMN_KEYWORDS = (
    "phone",
    "hp",
    "telepon",
    "telp",
    "nomor",
    "no_hp",
    "whatsapp",
    "wa",
)
MISSING_VALUES = {"", "n/a", "null", "-", "unknown", "none"}

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
EMOJI_REGEX = re.compile(
    r"[\U0001F300-\U0001F5FF\U0001F600-\U0001F64F\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]"
)
REPEATED_SYMBOL_REGEX = re.compile(r"([@#!#])\1+")
CONTROL_CHAR_REGEX = re.compile(r"[\x00-\x1F\x7F-\x9F]")


def _make_issue(
    issue_type: str,
    severity: str,
    column: str | None,
    row_index: int | None,
    value: Any,
    message: str,
    recommendation: str,
) -> DataQualityIssue:
    value_str = None
    if value is not None and not (isinstance(value, float) and pd.isna(value)):
        value_str = str(value)

    return DataQualityIssue(
        id=f"ISSUE-{uuid.uuid4().hex[:8]}",
        type=issue_type,  # type: ignore[arg-type]
        severity=severity,  # type: ignore[arg-type]
        column=column,
        row_index=row_index,
        value=value_str,
        message=message,
        recommendation=recommendation,
    )


def _normalize_column_name(column: str) -> str:
    return column.lower().replace(" ", "_")


def _is_email_column(column: str) -> bool:
    column_name = column.lower()
    return any(keyword in column_name for keyword in EMAIL_COLUMN_KEYWORDS)


def _is_phone_column(column: str) -> bool:
    column_name = column.lower()
    return any(keyword in column_name for keyword in PHONE_COLUMN_KEYWORDS)


def _is_missing_value(value: Any) -> bool:
    if pd.isna(value):
        return True
    if isinstance(value, str):
        normalized = value.strip().lower()
        return normalized in MISSING_VALUES
    return False


def _has_whitespace_issue(value: str) -> bool:
    return (
        value.startswith(" ")
        or value.endswith(" ")
        or "  " in value
        or "\t" in value
        or "\n" in value
    )


def _has_strange_characters(value: str) -> bool:
    if "�" in value:
        return True
    if EMOJI_REGEX.search(value):
        return True
    if CONTROL_CHAR_REGEX.search(value):
        return True
    if REPEATED_SYMBOL_REGEX.search(value):
        return True
    if any(not ch.isprintable() for ch in value):
        return True
    return False


def _is_valid_email(value: str) -> bool:
    return bool(EMAIL_REGEX.match(value.strip()))


def _is_valid_indonesian_phone(value: str) -> bool:
    normalized = re.sub(r"[\s\-\.]+", "", value)
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


def detect_duplicates(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    duplicate_mask = df.duplicated(keep="first")
    for idx, is_duplicate in enumerate(duplicate_mask):
        if is_duplicate:
            issues.append(
                _make_issue(
                    issue_type="duplicate",
                    severity="warning",
                    column=None,
                    row_index=idx + 1,
                    value=None,
                    message="Duplicate row detected.",
                    recommendation="Review and remove duplicated rows if they represent the same record.",
                )
            )
    return issues


def detect_missing_values(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    for idx, row in df.iterrows():
        for col in df.columns:
            value = row[col]
            if _is_missing_value(value):
                severity = "critical" if any(keyword in col.lower() for keyword in ("email", "phone", "hp", "nomor", "id", "nik", "nim")) else "warning"
                issues.append(
                    _make_issue(
                        issue_type="missing_value",
                        severity=severity,
                        column=str(col),
                        row_index=idx + 1,
                        value=None,
                        message="Missing or placeholder value detected.",
                        recommendation="Fill missing values or use a consistent placeholder for missing data.",
                    )
                )
    return issues


def detect_whitespace_issues(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    for idx, row in df.iterrows():
        for col in df.columns:
            value = row[col]
            if _is_missing_value(value):
                continue
            if isinstance(value, str):
                if _has_whitespace_issue(value):
                    issues.append(
                        _make_issue(
                            issue_type="whitespace",
                            severity="warning",
                            column=str(col),
                            row_index=idx + 1,
                            value=value,
                            message="Whitespace issue detected.",
                            recommendation="Trim extra spaces and normalize whitespace within text fields.",
                        )
                    )
    return issues


def detect_strange_characters(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    for idx, row in df.iterrows():
        for col in df.columns:
            value = row[col]
            if _is_missing_value(value):
                continue
            if isinstance(value, str) and _has_strange_characters(value):
                issues.append(
                    _make_issue(
                        issue_type="strange_character",
                        severity="warning",
                        column=str(col),
                        row_index=idx + 1,
                        value=value,
                        message="Strange character detected.",
                        recommendation="Remove unexpected symbols and non-printable characters.",
                    )
                )
    return issues


def detect_invalid_emails(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    for col in df.columns:
        if not _is_email_column(str(col)):
            continue
        for idx, row in df.iterrows():
            value = row[col]
            if _is_missing_value(value):
                continue
            if not _is_valid_email(str(value)):
                issues.append(
                    _make_issue(
                        issue_type="invalid_email",
                        severity="critical",
                        column=str(col),
                        row_index=idx + 1,
                        value=value,
                        message="Invalid email format detected.",
                        recommendation="Review and correct the email address.",
                    )
                )
    return issues


def detect_invalid_phones(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    for col in df.columns:
        if not _is_phone_column(str(col)):
            continue
        for idx, row in df.iterrows():
            value = row[col]
            if _is_missing_value(value):
                continue
            if not _is_valid_indonesian_phone(str(value)):
                issues.append(
                    _make_issue(
                        issue_type="invalid_phone",
                        severity="critical",
                        column=str(col),
                        row_index=idx + 1,
                        value=value,
                        message="Invalid Indonesian phone number detected.",
                        recommendation="Use a valid Indonesian phone format like 08123456789 or +628123456789.",
                    )
                )
    return issues


def summarize_issues(issues: list[DataQualityIssue]) -> IssueSummary:
    type_counts = Counter(issue.type for issue in issues)
    severity_counts = Counter(issue.severity for issue in issues)
    return IssueSummary(
        duplicate_count=type_counts.get("duplicate", 0),
        missing_value_count=type_counts.get("missing_value", 0),
        whitespace_count=type_counts.get("whitespace", 0),
        strange_character_count=type_counts.get("strange_character", 0),
        invalid_email_count=type_counts.get("invalid_email", 0),
        invalid_phone_count=type_counts.get("invalid_phone", 0),
        total_issues=len(issues),
        critical_issues=severity_counts.get("critical", 0),
        warning_issues=severity_counts.get("warning", 0),
        info_issues=severity_counts.get("info", 0),
    )


def calculate_quality_score(issues: list[DataQualityIssue]) -> int:
    severity_counts = Counter(issue.severity for issue in issues)
    penalty = severity_counts.get("critical", 0) * 5
    penalty += severity_counts.get("warning", 0) * 2
    penalty += severity_counts.get("info", 0) * 1
    score = max(0, 100 - penalty)
    return score


def get_quality_status(score: int) -> str:
    if score >= 85:
        return "Good"
    if score >= 70:
        return "Needs Review"
    if score >= 50:
        return "Poor"
    return "Critical"


def get_top_problem_columns(issues: list[DataQualityIssue]) -> list[str]:
    column_counts = Counter(issue.column for issue in issues if issue.column)
    return [column for column, _ in column_counts.most_common(3)]


def analyze_dataframe(df: pd.DataFrame, dataset_id: str) -> DataQualityAnalysisResponse:
    issues: list[DataQualityIssue] = []
    issues.extend(detect_duplicates(df))
    issues.extend(detect_missing_values(df))
    issues.extend(detect_whitespace_issues(df))
    issues.extend(detect_strange_characters(df))
    issues.extend(detect_invalid_emails(df))
    issues.extend(detect_invalid_phones(df))

    issue_summary = summarize_issues(issues)
    quality_score = calculate_quality_score(issues)
    status = get_quality_status(quality_score)
    top_problem_columns = get_top_problem_columns(issues)

    return DataQualityAnalysisResponse(
        dataset_id=dataset_id,
        row_count=int(len(df)),
        column_count=int(len(df.columns)),
        quality_score=quality_score,
        status=status,
        issue_summary=issue_summary,
        issues=issues[:200],
        top_problem_columns=top_problem_columns,
    )
