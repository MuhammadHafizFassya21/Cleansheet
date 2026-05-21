import re
import pandas as pd
from typing import Any

from ..models.cleaning import CleaningAction, CleaningPreviewChange
from ..models.issue import DataQualityIssue


def normalize_indonesian_phone(value: str) -> str | None:
    """
    Normalize Indonesian phone number to 62xxxxxxxx format.
    Returns None if value cannot be safely normalized.
    """
    if not value or not isinstance(value, str):
        return None

    # Remove common separators
    cleaned = re.sub(r"[\s\-\(\)\.]+", "", value.strip())

    # Must contain only digits and +
    if not re.match(r"^\+?\d+$", cleaned):
        return None

    # Handle +62 prefix
    if cleaned.startswith("+62"):
        cleaned = "62" + cleaned[3:]
    # Handle 0 prefix (Indonesia)
    elif cleaned.startswith("0"):
        cleaned = "62" + cleaned[1:]
    # If doesn't start with 62 and is not +62, assume local format starting with 0
    elif not cleaned.startswith("62"):
        return None

    # Must be reasonable length (62 + 9-13 digits)
    if not (11 <= len(cleaned) <= 15):
        return None

    return cleaned


def get_cleaning_recommendations(
    df: pd.DataFrame, issues: list[DataQualityIssue]
) -> list[CleaningAction]:
    """
    Generate cleaning action recommendations based on detected issues.
    """
    recommendations = []
    issue_types_present = set(issue.type for issue in issues)

    # Trim whitespace
    if "whitespace" in issue_types_present:
        affected_cells = len([i for i in issues if i.type == "whitespace"])
        affected_rows = len(
            set(i.row_index for i in issues if i.type == "whitespace" and i.row_index is not None)
        )
        recommendations.append(
            CleaningAction(
                id="trim_whitespace",
                label="Trim extra spaces",
                description="Remove leading, trailing, and repeated spaces from text values.",
                issue_types=["whitespace"],
                affected_cells=affected_cells,
                affected_rows=affected_rows,
                safe_to_apply=True,
            )
        )

    # Normalize phone
    if "invalid_phone" in issue_types_present:
        affected_cells = len([i for i in issues if i.type == "invalid_phone"])
        affected_rows = len(
            set(i.row_index for i in issues if i.type == "invalid_phone" and i.row_index is not None)
        )
        recommendations.append(
            CleaningAction(
                id="normalize_phone",
                label="Normalize Indonesian phone numbers",
                description="Convert valid Indonesian phone numbers into a consistent 62xxxxxxxx format.",
                issue_types=["invalid_phone"],
                affected_cells=affected_cells,
                affected_rows=affected_rows,
                safe_to_apply=False,
            )
        )

    # Remove duplicates
    if "duplicate" in issue_types_present:
        affected_cells = len([i for i in issues if i.type == "duplicate"])
        affected_rows = len(
            set(i.row_index for i in issues if i.type == "duplicate" and i.row_index is not None)
        )
        recommendations.append(
            CleaningAction(
                id="remove_duplicates",
                label="Remove duplicate rows",
                description="Remove fully duplicated rows while keeping the first occurrence.",
                issue_types=["duplicate"],
                affected_cells=affected_cells,
                affected_rows=affected_rows,
                safe_to_apply=True,
            )
        )

    # Standardize missing values
    if "missing_value" in issue_types_present:
        affected_cells = len([i for i in issues if i.type == "missing_value"])
        affected_rows = len(
            set(i.row_index for i in issues if i.type == "missing_value" and i.row_index is not None)
        )
        recommendations.append(
            CleaningAction(
                id="standardize_missing_values",
                label="Standardize missing values",
                description="Convert placeholders such as N/A, NULL, -, unknown, and none into empty values.",
                issue_types=["missing_value"],
                affected_cells=affected_cells,
                affected_rows=affected_rows,
                safe_to_apply=True,
            )
        )

    return recommendations


def trim_whitespace_preview(df: pd.DataFrame, limit: int = 100) -> tuple[list[CleaningPreviewChange], int]:
    """
    Generate preview of trim whitespace action.
    Returns (changes_list, total_count)
    """
    changes = []
    total_count = 0

    for col in df.columns:
        for idx, val in df[col].items():
            if isinstance(val, str):
                trimmed = re.sub(r"\s+", " ", val.strip())
                if trimmed != val:
                    total_count += 1
                    if len(changes) < limit:
                        changes.append(
                            CleaningPreviewChange(
                                row_index=idx,
                                column=col,
                                original_value=val,
                                cleaned_value=trimmed,
                                action_id="trim_whitespace",
                                message="Whitespace will be normalized.",
                            )
                        )

    return changes, total_count


def normalize_phone_preview(df: pd.DataFrame, limit: int = 100) -> tuple[list[CleaningPreviewChange], int]:
    """
    Generate preview of normalize phone action.
    Returns (changes_list, total_count)
    """
    changes = []
    total_count = 0

    for col in df.columns:
        for idx, val in df[col].items():
            if isinstance(val, str):
                normalized = normalize_indonesian_phone(val)
                if normalized and normalized != val:
                    total_count += 1
                    if len(changes) < limit:
                        changes.append(
                            CleaningPreviewChange(
                                row_index=idx,
                                column=col,
                                original_value=val,
                                cleaned_value=normalized,
                                action_id="normalize_phone",
                                message="Phone number will be normalized to Indonesian 62 format.",
                            )
                        )

    return changes, total_count


def remove_duplicates_preview(df: pd.DataFrame, limit: int = 100) -> tuple[list[CleaningPreviewChange], int]:
    """
    Generate preview of remove duplicates action.
    Returns (changes_list, total_count)
    """
    changes = []
    duplicates = df[df.duplicated(keep="first")]
    total_count = len(duplicates)

    for idx, (_, row) in enumerate(duplicates.iterrows()):
        if idx >= limit:
            break
        changes.append(
            CleaningPreviewChange(
                row_index=row.name,
                column=None,
                original_value=None,
                cleaned_value=None,
                action_id="remove_duplicates",
                message="Duplicate row will be removed.",
            )
        )

    return changes, total_count


def standardize_missing_values_preview(df: pd.DataFrame, limit: int = 100) -> tuple[list[CleaningPreviewChange], int]:
    """
    Generate preview of standardize missing values action.
    Returns (changes_list, total_count)
    """
    missing_placeholders = {"N/A", "NULL", "n/a", "null", "-", "unknown", "none"}
    changes = []
    total_count = 0

    for col in df.columns:
        for idx, val in df[col].items():
            if isinstance(val, str) and val.strip() in missing_placeholders:
                total_count += 1
                if len(changes) < limit:
                    changes.append(
                        CleaningPreviewChange(
                            row_index=idx,
                            column=col,
                            original_value=val,
                            cleaned_value=None,
                            action_id="standardize_missing_values",
                            message="Missing value placeholder will be standardized.",
                        )
                    )

    return changes, total_count


def generate_cleaning_preview(
    df: pd.DataFrame, selected_actions: list[str], limit: int = 100
) -> tuple[list[CleaningPreviewChange], int]:
    """
    Generate before-after preview for selected cleaning actions.
    Returns (preview_changes, total_changes)
    """
    all_changes = []
    total_all = 0

    for action_id in selected_actions:
        if action_id == "trim_whitespace":
            changes, total = trim_whitespace_preview(df, limit - len(all_changes))
            all_changes.extend(changes)
            total_all += total
        elif action_id == "normalize_phone":
            changes, total = normalize_phone_preview(df, limit - len(all_changes))
            all_changes.extend(changes)
            total_all += total
        elif action_id == "remove_duplicates":
            changes, total = remove_duplicates_preview(df, limit - len(all_changes))
            all_changes.extend(changes)
            total_all += total
        elif action_id == "standardize_missing_values":
            changes, total = standardize_missing_values_preview(df, limit - len(all_changes))
            all_changes.extend(changes)
            total_all += total

        if len(all_changes) >= limit:
            break

    return all_changes, total_all
