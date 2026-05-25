import io
import math
import uuid
import pandas as pd
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

SUPPORTED_EXTENSIONS = {".csv", ".tsv", ".txt", ".xlsx", ".xls"}


def _extension(filename: str) -> str:
    if not filename:
        return ""
    lower = filename.lower()
    for ext in sorted(SUPPORTED_EXTENSIONS, key=len, reverse=True):
        if lower.endswith(ext):
            return ext
    return ""


def validate_data_file(file: UploadFile, file_size: int):
    ext = _extension(file.filename or "")
    if ext not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported: {supported}",
        )

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5 MB limit.")


# Backward-compatible alias
def validate_csv_file(file: UploadFile, file_size: int):
    validate_data_file(file, file_size)


def detect_basic_column_type(series: pd.Series) -> str:
    # Use a sample for type detection to avoid slow datetime parsing on huge datasets
    non_nulls = series.dropna().head(1000)
    if non_nulls.empty:
        return "unknown"

    str_vals = non_nulls.astype(str).str.strip().str.lower()
    bool_set = {"true", "false", "1", "0", "yes", "no", "t", "f"}
    if str_vals.isin(bool_set).all():
        return "boolean"

    numeric_conv = pd.to_numeric(non_nulls, errors="coerce")
    valid_numeric_pct = numeric_conv.notna().sum() / len(non_nulls)
    if valid_numeric_pct > 0.7:
        return "number"

    str_non_nulls = non_nulls.astype(str).str.strip()
    if str_non_nulls.str.len().mean() >= 6:
        try:
            date_conv = pd.to_datetime(non_nulls, errors="coerce")
            valid_date_pct = date_conv.notna().sum() / len(non_nulls)
            if valid_date_pct > 0.7:
                return "date"
        except Exception:
            pass

    return "text"


def sanitize_value(val: Any) -> Any:
    if pd.isna(val) or val is pd.NaT:
        return None
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
    return val


def sanitize_preview_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [{k: sanitize_value(v) for k, v in record.items()} for record in records]


def read_data_file(file_bytes: bytes, filename: str = "dataset.csv") -> pd.DataFrame:
    ext = _extension(filename)
    if not ext:
        ext = ".csv"

    try:
        if ext in {".csv", ".txt"}:
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif ext == ".tsv":
            df = pd.read_csv(io.BytesIO(file_bytes), sep="\t")
        elif ext == ".xlsx":
            df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl")
        elif ext == ".xls":
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            df = pd.read_csv(io.BytesIO(file_bytes))
    except ImportError:
        raise HTTPException(
            status_code=400,
            detail="Excel support requires openpyxl. Install it on the backend server.",
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to parse {ext} file. Check that the file is valid.",
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty.")

    if len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="File must contain at least one column.")

    return df


def read_csv_file(file_bytes: bytes) -> pd.DataFrame:
    return read_data_file(file_bytes, "dataset.csv")


def generate_dataset_metadata(
    df: pd.DataFrame, file_name: str, file_size: int, dataset_id: str | None = None
) -> Dict[str, Any]:
    columns_info = []

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        unique_count = int(series.nunique(dropna=True))
        detected_type = detect_basic_column_type(series)

        columns_info.append(
            {
                "name": str(col),
                "detected_type": detected_type,
                "missing_count": missing_count,
                "unique_count": unique_count,
            }
        )

    from . import quality_engine

    sample_df = df.head(1000)
    issues = []
    
    # We catch exceptions here to prevent Internal Server Errors if a specific detection fails
    try:
        issues.extend(quality_engine.detect_missing_values(sample_df))
        issues.extend(quality_engine.detect_invalid_emails(sample_df))
        issues.extend(quality_engine.detect_invalid_phones(sample_df))
        issues.extend(quality_engine.detect_suspicious_negative_numbers(sample_df))
        issues.extend(quality_engine.detect_strange_characters(sample_df))
    except Exception as e:
        print(f"Preview detection error: {e}")

    dirty_indices = set()
    for issue in issues:
        if issue.row_index:
            dirty_indices.add(issue.row_index - 1)

    sorted_dirty = sorted(list(dirty_indices))
    preview_labels = sorted_dirty[:20]

    if preview_labels:
        valid_labels = [idx for idx in preview_labels if idx in sample_df.index]
        preview_df = df.loc[valid_labels]
    else:
        preview_df = df.head(0).copy()

    # Inject original row index
    preview_df = preview_df.copy()
    preview_df["_original_row_index"] = preview_df.index + 1

    raw_preview = preview_df.to_dict(orient="records")
    preview_records = sanitize_preview_records(raw_preview)
    
    preview_issues = [
        {
            "row_index": i.row_index,
            "column": i.column,
            "type": i.type
        } for i in issues if i.row_index is not None and (i.row_index - 1) in preview_labels
    ]

    return {
        "dataset_id": dataset_id or f"ds_{uuid.uuid4().hex[:8]}",
        "file_name": file_name,
        "file_size": file_size,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns_info,
        "preview": preview_records,
        "preview_issues": preview_issues,
    }
