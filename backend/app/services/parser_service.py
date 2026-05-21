import io
import math
import uuid
import pandas as pd
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

def validate_csv_file(file: UploadFile, file_size: int):
    # Validate filename extension (case-insensitive)
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    # Validate file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 5 MB limit.")

def detect_basic_column_type(series: pd.Series) -> str:
    non_nulls = series.dropna()
    if non_nulls.empty:
        return "unknown"
    
    # 1. Check boolean
    # Convert elements to string to check
    str_vals = non_nulls.astype(str).str.strip().str.lower()
    bool_set = {'true', 'false', '1', '0', 'yes', 'no', 't', 'f'}
    if str_vals.isin(bool_set).all():
        return "boolean"
    
    # 2. Check numeric
    numeric_conv = pd.to_numeric(non_nulls, errors='coerce')
    valid_numeric_pct = numeric_conv.notna().sum() / len(non_nulls)
    if valid_numeric_pct > 0.7:
        return "number"
    
    # 3. Check date
    # First, make sure they are not purely integers or short numbers (to avoid false date parsing like year "2024" or value "100")
    # Also, we check if they look like strings before attempting datetime conversion
    str_non_nulls = non_nulls.astype(str).str.strip()
    # Check if average length is >= 6 characters (e.g. "12/05/24", "2024-05-12")
    if str_non_nulls.str.len().mean() >= 6:
        try:
            date_conv = pd.to_datetime(non_nulls, errors='coerce')
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

def read_csv_file(file_bytes: bytes) -> pd.DataFrame:
    try:
        # Use StringIO/BytesIO to read into pandas
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Unable to parse CSV file.")
    
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")
        
    if len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="CSV file must contain at least one column.")
        
    return df

def generate_dataset_metadata(df: pd.DataFrame, file_name: str, file_size: int) -> Dict[str, Any]:
    columns_info = []
    
    for col in df.columns:
        series = df[col]
        missing_count = int(series.isna().sum())
        unique_count = int(series.nunique(dropna=True))
        detected_type = detect_basic_column_type(series)
        
        columns_info.append({
            "name": str(col),
            "detected_type": detected_type,
            "missing_count": missing_count,
            "unique_count": unique_count
        })
        
    # Preview up to 20 rows
    preview_df = df.head(20)
    raw_preview = preview_df.to_dict(orient="records")
    preview_records = sanitize_preview_records(raw_preview)
    
    return {
        "dataset_id": f"ds_{uuid.uuid4().hex[:8]}",
        "file_name": file_name,
        "file_size": file_size,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns_info,
        "preview": preview_records
    }
