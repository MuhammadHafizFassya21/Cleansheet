import json
from fastapi import APIRouter, HTTPException

from ..models.ai import AIInsightRequest, AIInsightResponse
from ..services.ai_service import fallback_or_generate

router = APIRouter()


@router.post("/insight", response_model=AIInsightResponse)
def generate_insight(req: AIInsightRequest):
    try:
        payload = req.model_dump()
        result = fallback_or_generate(payload)

        # Ensure response is JSON-serializable and follows expected structure.
        # If fallback/generation returns unexpected structure, raise to trigger fallback.
        return AIInsightResponse(**result)
    except Exception:
        # Hard fallback if something unexpected happens.
        fallback = AIInsightResponse(**fallback_or_generate(req.model_dump()))
        return fallback
