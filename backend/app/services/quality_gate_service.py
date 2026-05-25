"""
Final quality gate — ensures no blocking data quality issues remain before export.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from ..models.issue import DataQualityIssue
from ..services import cleaning_engine, quality_engine

# Issues that must never remain in an exported dataset (unless explicitly acknowledged).
BLOCKING_MANUAL_TYPES = {
    "invalid_email",
    "invalid_phone",
    "suspicious_negative_number",
    "strange_character",
    "missing_value",
}


def detect_manual_review_issues_only(df: pd.DataFrame) -> list[DataQualityIssue]:
    issues: list[DataQualityIssue] = []
    issues.extend(quality_engine.detect_invalid_emails(df))
    issues.extend(quality_engine.detect_invalid_phones(df))
    issues.extend(quality_engine.detect_suspicious_negative_numbers(df))
    issues.extend(quality_engine.detect_strange_characters(df))
    issues.extend(quality_engine.detect_missing_values(df))
    return issues

# Auto-fixable issues that still block export until resolved.
BLOCKING_AUTO_TYPES = {
    "duplicate",
    "whitespace",
}

# Critical missing in key identifier columns always blocks.
CRITICAL_MISSING_COLUMN_KEYWORDS = (
    "email",
    "phone",
    "hp",
    "telepon",
    "id",
    "nik",
    "nim",
    "nama",
    "name",
)


def issue_stable_key(issue: DataQualityIssue | Any) -> str:
    """Stable identifier across re-scans (IDs from detection are ephemeral)."""
    row = getattr(issue, "row_index", None) or 0
    col = getattr(issue, "column", None) or ""
    itype = getattr(issue, "type", None) or ""
    return f"{row}:{col}:{itype}"


def _is_critical_missing(issue: DataQualityIssue) -> bool:
    if issue.type != "missing_value":
        return False
    col = (issue.column or "").lower()
    return any(kw in col for kw in CRITICAL_MISSING_COLUMN_KEYWORDS)


def detect_all_issues(df: pd.DataFrame) -> list[DataQualityIssue]:
    """Full scan used for scoring and auto-fixable blocking checks."""
    issues: list[DataQualityIssue] = []
    issues.extend(quality_engine.detect_duplicates(df))
    issues.extend(quality_engine.detect_missing_values(df))
    issues.extend(quality_engine.detect_whitespace_issues(df))
    issues.extend(quality_engine.detect_strange_characters(df))
    issues.extend(quality_engine.detect_invalid_emails(df))
    issues.extend(quality_engine.detect_invalid_phones(df))
    issues.extend(quality_engine.detect_suspicious_negative_numbers(df))
    return issues


def enforce_safety_net_cleaning(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Mandatory safe normalization applied before every export / gate check.
    Does not remove duplicates or change business values (negatives, invalid emails).
    """
    work = df.copy()
    cells = 0
    cells += cleaning_engine.apply_trim_whitespace(work)
    cells += cleaning_engine.apply_standardize_missing_values(work)
    cells += cleaning_engine.apply_remove_strange_characters(work)
    return work, cells


@dataclass
class QualityGateResult:
    passed: bool
    quality_score: int
    status: str
    blocking_issue_count: int
    manual_review_count: int
    auto_blocking_count: int
    blocking_issues: list[DataQualityIssue] = field(default_factory=list)
    manual_issues: list[DataQualityIssue] = field(default_factory=list)
    acknowledged_count: int = 0
    messages: list[str] = field(default_factory=list)

    def to_summary_dict(self) -> dict[str, Any]:
        return {
            "passed": self.passed,
            "quality_score": self.quality_score,
            "status": self.status,
            "blocking_issue_count": self.blocking_issue_count,
            "manual_review_count": self.manual_review_count,
            "auto_blocking_count": self.auto_blocking_count,
            "acknowledged_count": self.acknowledged_count,
            "messages": self.messages,
        }


def run_quality_gate(
    df: pd.DataFrame,
    acknowledged_issue_keys: set[str] | None = None,
    *,
    apply_safety_net: bool = True,
) -> tuple[pd.DataFrame, QualityGateResult]:
    """
    Run strict quality gate on dataframe.

    acknowledged_issue_keys: stable keys (row:col:type) the user explicitly marked valid
    during manual review (only applies to manual-review issue types).
    """
    acknowledged = acknowledged_issue_keys or set()

    if apply_safety_net:
        work_df, _ = enforce_safety_net_cleaning(df)
    else:
        work_df = df.copy()

    all_issues = detect_all_issues(work_df)
    manual_issues = detect_manual_review_issues_only(work_df)

    blocking: list[DataQualityIssue] = []
    acknowledged_count = 0

    for issue in all_issues:
        key = issue_stable_key(issue)

        if issue.type in BLOCKING_MANUAL_TYPES:
            if key in acknowledged:
                acknowledged_count += 1
                continue
            blocking.append(issue)
            continue

        if issue.type in BLOCKING_AUTO_TYPES:
            if issue.type == "missing_value" and not _is_critical_missing(issue):
                # Non-critical missing values: warn in score but do not block export
                continue
            blocking.append(issue)

    manual_keys = {issue_stable_key(i) for i in manual_issues}
    for issue in manual_issues:
        key = issue_stable_key(issue)
        if key in acknowledged:
            acknowledged_count += 1
        elif key not in {issue_stable_key(b) for b in blocking}:
            blocking.append(issue)
        manual_keys.discard(key)

    # Ensure manual issues not in all_issues scan are included
    for issue in manual_issues:
        key = issue_stable_key(issue)
        if key in acknowledged:
            continue
        if not any(issue_stable_key(b) == key for b in blocking):
            blocking.append(issue)

    quality_score = quality_engine.calculate_quality_score(all_issues)
    status = quality_engine.get_quality_status(quality_score)

    auto_blocking = [i for i in blocking if i.type not in BLOCKING_MANUAL_TYPES]
    manual_blocking = [i for i in blocking if i.type in BLOCKING_MANUAL_TYPES]

    messages: list[str] = []
    if manual_blocking:
        messages.append(
            f"{len(manual_blocking)} isu manual belum diselesaikan (perbaiki atau tandai valid)."
        )
    if auto_blocking:
        messages.append(
            f"{len(auto_blocking)} isu otomatis masih tersisa (jalankan aksi pembersihan yang sesuai)."
        )

    passed = len(blocking) == 0

    if passed:
        messages.append("Dataset lulus pemeriksaan kualitas final.")
    else:
        messages.append("Dataset belum memenuhi standar ekspor — perbaiki isu yang tersisa.")

    result = QualityGateResult(
        passed=passed,
        quality_score=quality_score,
        status=status,
        blocking_issue_count=len(blocking),
        manual_review_count=len(manual_blocking),
        auto_blocking_count=len(auto_blocking),
        blocking_issues=blocking[:100],
        manual_issues=manual_issues,
        acknowledged_count=acknowledged_count,
        messages=messages,
    )

    return work_df, result


def validate_manual_edits_strict(
    df: pd.DataFrame,
    edits: list[Any],
    pending_issues: list[Any],
) -> tuple[list[str], list[str]]:
    """
    Validate edits against pending issues. Returns (errors, warnings).
    Rejects empty fixes for critical invalid email/phone.
    """
    errors: list[str] = []
    warnings: list[str] = []

    pending_by_cell: dict[tuple[int, str], list[Any]] = {}
    for iss in pending_issues:
        pending_by_cell.setdefault((int(iss.row_index), str(iss.column)), []).append(iss)

    for ed in edits:
        row = int(ed.row_index)
        col = str(ed.column)
        new_val = (ed.new_value or "").strip()
        cell_issues = pending_by_cell.get((row, col), [])

        if not cell_issues:
            warnings.append(f"Baris {row}, kolom {col}: tidak ada isu terkait (edit diabaikan).")
            continue

        for iss in cell_issues:
            from ..services import manual_review_service

            res = manual_review_service.validate_manual_value(col, new_val, iss.type)
            if not res.is_valid:
                errors.append(f"Baris {row}, kolom {col}: {res.message}")

    return errors, warnings


def ensure_all_manual_issues_resolved(
    pending_issues: list[Any],
    edit_keys: set[tuple[int, str]],
    acknowledged_keys: set[str],
) -> list[str]:
    """
    Every pending manual issue must have either a valid edit on its cell or be acknowledged.
    """
    unresolved: list[str] = []
    for iss in pending_issues:
        key = issue_stable_key(iss)
        if key in acknowledged_keys:
            continue
        cell_key = (int(iss.row_index), str(iss.column))
        if cell_key in edit_keys:
            continue
        unresolved.append(
            f"Baris {iss.row_index}, kolom {iss.column} ({iss.type}): belum diperbaiki atau ditandai valid."
        )
    return unresolved
