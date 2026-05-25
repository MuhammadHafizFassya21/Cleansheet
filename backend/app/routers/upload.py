from fastapi import APIRouter, File, UploadFile, HTTPException
from ..models.dataset import DatasetPreviewResponse
from ..services import parser_service, dataset_store

router = APIRouter()


@router.post("/", response_model=DatasetPreviewResponse)
def upload_dataset(file: UploadFile = File(...)):
    try:
        contents = file.file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read upload file.")

    file_size = len(contents)
    file_name = file.filename or "dataset.csv"

    parser_service.validate_data_file(file, file_size)

    df = parser_service.read_data_file(contents, file_name)
    metadata = parser_service.generate_dataset_metadata(df, file_name, file_size)

    dataset_store.save_dataset(
        df,
        file_name,
        stage="uploaded",
        metadata={"source": "upload"},
        dataset_id=metadata["dataset_id"],
    )

    return metadata
