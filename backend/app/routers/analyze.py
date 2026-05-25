from fastapi import APIRouter, File, UploadFile, HTTPException, Path

from ..models.issue import DataQualityAnalysisResponse
from ..services import parser_service, quality_engine, dataset_store

router = APIRouter()


@router.post("/", response_model=DataQualityAnalysisResponse)
def analyze_dataset(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

    file_size = len(contents)
    file_name = file.filename or "dataset.csv"
    parser_service.validate_data_file(file, file_size)

    df = parser_service.read_data_file(contents, file_name)
    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty.")

    metadata = parser_service.generate_dataset_metadata(df, file_name, file_size)
    dataset_id = metadata["dataset_id"]
    dataset_store.save_dataset(
        df,
        file_name,
        stage="analyzed",
        metadata={"source": "analyze_upload"},
        dataset_id=dataset_id,
    )

    return quality_engine.analyze_dataframe(df, dataset_id)


@router.get("/{dataset_id}", response_model=DataQualityAnalysisResponse)
def analyze_stored_dataset(dataset_id: str = Path(...)):
    stored = dataset_store.get_dataset(dataset_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Dataset not found or expired.")

    df = stored["df"]
    return quality_engine.analyze_dataframe(df, dataset_id)
