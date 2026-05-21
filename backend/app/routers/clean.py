import json
import uuid

from fastapi import APIRouter, File, UploadFile, Form, HTTPException

from ..models.cleaning import CleaningPreviewResponse
from ..services import parser_service, quality_engine, cleaning_engine

router = APIRouter()


@router.post("/preview", response_model=CleaningPreviewResponse)
async def cleaning_preview(
    file: UploadFile = File(...),
    selected_actions: str = Form(default="[]"),
):
    """
    Generate cleaning recommendations and preview based on uploaded CSV.
    """
    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to analyze dataset.")

    file_size = len(contents)
    parser_service.validate_csv_file(file, file_size)

    df = parser_service.read_csv_file(contents)
    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    # Analyze dataset for issues
    analysis = quality_engine.analyze_dataframe(df, f"ds_{uuid.uuid4().hex[:8]}")

    # Get cleaning recommendations
    recommended_actions = cleaning_engine.get_cleaning_recommendations(df, analysis.issues)

    # Parse selected actions
    try:
        if isinstance(selected_actions, str):
            selected_actions_list = json.loads(selected_actions)
        else:
            selected_actions_list = selected_actions
    except json.JSONDecodeError:
        selected_actions_list = []

    # Validate selected actions
    valid_action_ids = {action.id for action in recommended_actions}
    selected_actions_list = [a for a in selected_actions_list if a in valid_action_ids]

    # Generate preview
    preview_changes = []
    total_preview_changes = 0

    if selected_actions_list:
        preview_changes, total_preview_changes = cleaning_engine.generate_cleaning_preview(
            df, selected_actions_list, limit=100
        )

    return CleaningPreviewResponse(
        dataset_id=analysis.dataset_id,
        recommended_actions=recommended_actions,
        selected_actions=selected_actions_list,
        preview_changes=preview_changes,
        preview_limit=100,
        total_preview_changes=total_preview_changes,
    )
