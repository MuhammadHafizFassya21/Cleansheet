from fastapi import APIRouter, File, UploadFile, HTTPException
from ..models.dataset import DatasetPreviewResponse
from ..services import parser_service

router = APIRouter()

@router.post("/", response_model=DatasetPreviewResponse)
async def upload_csv(file: UploadFile = File(...)):
    # 1. Read file contents to determine size and have bytes ready
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read upload file.")
        
    file_size = len(contents)
    
    # 2. Validate file (extension and size)
    parser_service.validate_csv_file(file, file_size)
    
    # 3. Parse CSV to DataFrame
    df = parser_service.read_csv_file(contents)
    
    # 4. Generate metadata & preview
    metadata = parser_service.generate_dataset_metadata(df, file.filename or "unknown.csv", file_size)
    
    return metadata
