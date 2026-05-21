import uuid

from fastapi import APIRouter, File, UploadFile, HTTPException

from ..models.issue import DataQualityAnalysisResponse
from ..services import parser_service, quality_engine

router = APIRouter()


@router.post("/", response_model=DataQualityAnalysisResponse)
async def analyze_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

    file_size = len(contents)
    parser_service.validate_csv_file(file, file_size)

    df = parser_service.read_csv_file(contents)
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    dataset_id = f"ds_{uuid.uuid4().hex[:8]}"
    return quality_engine.analyze_dataframe(df, dataset_id)
