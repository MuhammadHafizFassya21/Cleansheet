import re
import pandas as pd
from typing import Any

from ..models.cleaning import CleaningAction, CleaningPreviewChange
from ..models.issue import DataQualityIssue


_PHONE_LIKE_COL_SUBSTRINGS = [
    "phone",
    "hp",
    "telepon",
    "telp",
    "nomor",
    "no_hp",
    "whatsapp",
    "wa",
]


def is_phone_like_column(column_name: str) -> bool:
    name = (column_name or "").strip().lower()
    return any(substr in name for substr in _PHONE_LIKE_COL_SUBSTRINGS)


def normalize_indonesian_phone(value: str) -> str | None:
    """
    Normalize Indonesian phone number to 62xxxxxxxx format.
    Returns None if value cannot be safely normalized.
    """
    if not value or not isinstance(value, str):
        return None

    raw = value.strip()
    if not raw:
        return None

    # Do not normalize values that contain letters
    if re.search(r"[A-Za-z]", raw):
        return None

    # Remove spaces, hyphens, parentheses, and plus sign
    cleaned = re.sub(r"[\s\-\(\)\+\.]+", "", raw)

    # Must contain only digits
    if not re.match(r"^\d+$", cleaned):
        return None

    # If starts with 08 -> convert to 628xxxx...
    if cleaned.startswith("08"):
        cleaned = "62" + cleaned[1:]
    # If starts with 628... keep as-is
    elif cleaned.startswith("628"):
        cleaned = cleaned
    # If starts with 8 and reasonable length -> convert to 62 + value
    elif cleaned.startswith("8"):
        # local values often are 8 + 9-13 digits
        # after prefix change, total length should land around 11-15
        candidate = "62" + cleaned
        if 11 <= len(candidate) <= 15:
            cleaned = candidate
        else:
            return None
    # If already starts with 62 keep
    elif cleaned.startswith("62"):
        pass
    else:
        return None

    # Must be reasonable length (62 + 9-13 digits)
    if not (11 <= len(cleaned) <= 15):
        return None

    # If resulting cleaned value is too short/long, reject
    if len(cleaned) < 11 or len(cleaned) > 15:
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


def _normalize_missing_placeholder_to_empty(val: Any) -> Any:
    missing_placeholders = {
        "N/A",
        "NULL",
        "n/a",
        "null",
        "-",
        "unknown",
        "none",
    }

    # Note: for non-object columns (e.g. float), assigning "" will raise.
    # Callers should decide whether to turn missing values into "".
    if val is None:
        return ""

    if pd.isna(val):
        return ""

    if isinstance(val, str):
        if val.strip() in missing_placeholders:
            return ""
    return val


def apply_trim_whitespace(df: pd.DataFrame) -> int:
    """
    Apply trim_whitespace to text/object columns.
    Returns cells_modified count (cells whose value changed).
    """
    cells_modified = 0

    for col in df.columns:
        if df[col].dtype == "object":
            for idx, val in df[col].items():
                if isinstance(val, str):
                    normalized = re.sub(r"\s+", " ", val.strip())
                    if normalized != val:
                        df.at[idx, col] = normalized
                        cells_modified += 1

    return cells_modified


def apply_normalize_phone(df: pd.DataFrame) -> int:
    """
    Apply normalize_phone to phone-like columns only.
    Returns cells_modified count.
    """
    cells_modified = 0

    for col in df.columns:
        if not is_phone_like_column(str(col)):
            continue

        for idx, val in df[col].items():
            if not isinstance(val, str):
                continue

            normalized = normalize_indonesian_phone(val)
            # If can't normalize safely, preserve original as-is
            if normalized is None or normalized == val:
                continue

            df.at[idx, col] = normalized
            cells_modified += 1

    return cells_modified


def apply_remove_duplicates(df: pd.DataFrame) -> int:
    """
    Remove fully duplicated rows while keeping first occurrence.
    Returns rows_removed.
    """
    before = len(df)
    df.drop_duplicates(keep="first", inplace=True)
    after = len(df)
    return max(0, before - after)


def apply_standardize_missing_values(df: pd.DataFrame) -> int:
    """
    Convert placeholders into empty string for CSV output.
    Returns cells_modified count.
    """
    cells_modified = 0

    for col in df.columns:
        series = df[col]
        is_object_like = series.dtype == "object" or pd.api.types.is_string_dtype(series.dtype)

        for idx, val in series.items():
            # For numeric/date columns, keep missing values as-is (NaN/NaT),
            # because assigning "" would raise (e.g. float64).
            if not is_object_like and (val is None or pd.isna(val)):
                continue

            new_val = _normalize_missing_placeholder_to_empty(val)
            if new_val == val:
                continue

            if not is_object_like and new_val == "":
                # For non-object columns, represent standardized "missing" as NA instead of "".
                df.at[idx, col] = pd.NA
            else:
                df.at[idx, col] = new_val
            cells_modified += 1

    return cells_modified


def apply_cleaning_actions(
    df: pd.DataFrame, selected_actions: list[str]
) -> tuple[
    pd.DataFrame,
    int,  # original_row_count
    int,  # cleaned_row_count
    int,  # rows_removed
    int,  # cells_modified
    list[str],  # actions_applied
]:
    """
    Orchestrate apply cleaning functions + compute metrics.
    """
    if not selected_actions:
        raise ValueError("No cleaning action selected.")

    supported = {
        "trim_whitespace",
        "normalize_phone",
        "remove_duplicates",
        "standardize_missing_values",
    }
    invalid = [a for a in selected_actions if a not in supported]
    if invalid:
        raise ValueError(f"Invalid selected cleaning action: {invalid[0]}")

    actions_applied: list[str] = []
    original_row_count = len(df)
    rows_removed = 0
    cells_modified = 0

    # Work on a copy to avoid mutating caller unexpectedly
    cleaned_df = df.copy()

    for action_id in selected_actions:
        if action_id == "trim_whitespace":
            cells_modified += apply_trim_whitespace(cleaned_df)
            actions_applied.append(action_id)
        elif action_id == "normalize_phone":
            cells_modified += apply_normalize_phone(cleaned_df)
            actions_applied.append(action_id)
        elif action_id == "remove_duplicates":
            rows_removed += apply_remove_duplicates(cleaned_df)
            actions_applied.append(action_id)
        elif action_id == "standardize_missing_values":
            cells_modified += apply_standardize_missing_values(cleaned_df)
            actions_applied.append(action_id)

    cleaned_row_count = len(cleaned_df)

    return (
        cleaned_df,
        original_row_count,
        cleaned_row_count,
        rows_removed,
        cells_modified,
        actions_applied,
    )


def dataframe_to_csv_bytes(df: pd.DataFrame) -> bytes:
    """
    Convert dataframe to UTF-8 CSV bytes.
    Ensures empty strings for missing values in CSV output.
    """
    csv_df = df.copy()
    # Replace NaN/NaT with empty string
    for col in csv_df.columns:
        csv_df[col] = csv_df[col].where(~pd.isna(csv_df[col]), "")

    return csv_df.to_csv(index=False).encode("utf-8")
