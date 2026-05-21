import json
import os
from typing import Any, Dict

from . import __init__  # noqa: F401

# Gemini SDK import is done lazily inside generate_ai_insight
# so the app can still run even if dependency isn't installed yet.


def fallback_ai_insight(payload: Dict[str, Any]) -> Dict[str, Any]:
    status = payload.get("status") or "Needs Review"
    quality_score = payload.get("quality_score")
    return {
        "dataset_id": payload.get("dataset_id", ""),
        "summary": (
            "Your dataset needs review. Several data quality issues were detected. "
            "Apply safe cleaning actions and re-check the quality score."
        ),
        "biggest_risks": [
            "Critical issues may affect data reliability.",
            "Warning issues may reduce consistency and usability.",
        ],
        "priority_fixes": [
            "Review critical issues first.",
            "Apply safe cleaning actions such as trimming whitespace and standardizing missing values.",
        ],
        "readiness_status": "Needs Review" if status else "Needs Review",
        "confidence_note": (
            "AI insight fallback was generated because Gemini is not configured or unavailable."
        ),
    }


def build_ai_insight_prompt(payload: Dict[str, Any]) -> str:
    # Keep prompt privacy-aware: only summary statistics and issue summary.
    return (
        "You are CleanSheet AI, a professional data quality assistant.\n\n"
        "Your task is to explain the following data quality analysis result to a non-technical user.\n"
        "Important rules:\n"
        "- Do not ask for the original dataset.\n"
        "- Do not invent issues that are not present in the provided summary.\n"
        "- Do not mention raw personal data (emails, phone numbers, names, etc.).\n"
        "- Do not request sensitive data.\n"
        "- Use simple, clear, professional language.\n"
        "- Return JSON only.\n"
        "- Do not include markdown.\n\n"
        "Input summary:\n"
        f"{json.dumps(payload, ensure_ascii=False)}\n\n"
        "Return JSON using exactly this structure:\n"
        "{\n"
        '  "summary": "string",\n'
        '  "biggest_risks": ["string", "string", "string"],\n'
        '  "priority_fixes": ["string", "string", "string"],\n'
        '  "readiness_status": "Ready | Needs Review | Not Ready",\n'
        '  "confidence_note": "string"\n'
        "}\n"
    )


def _safe_extract_json(text: str) -> Dict[str, Any] | None:
    if not text:
        return None

    # Try direct parse
    try:
        return json.loads(text)
    except Exception:
        pass

    # Try to locate a JSON object inside text
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    candidate = text[start : end + 1]
    try:
        return json.loads(candidate)
    except Exception:
        return None


def generate_ai_insight(payload: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return fallback_ai_insight(payload)

    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    prompt = build_ai_insight_prompt(payload)

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)

        # Request JSON only
        resp = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
            },
        )

        text = getattr(resp, "text", None) or str(resp)
        parsed = _safe_extract_json(text)
        if not parsed:
            return fallback_ai_insight(payload)

        # Ensure required keys exist (minimally)
        parsed.setdefault("dataset_id", payload.get("dataset_id", ""))
        parsed.setdefault("summary", "")
        parsed.setdefault("biggest_risks", [])
        parsed.setdefault("priority_fixes", [])
        parsed.setdefault("readiness_status", "Needs Review")
        parsed.setdefault("confidence_note", "Gemini response parsed successfully.")

        return parsed
    except Exception:
        return fallback_ai_insight(payload)


def fallback_or_generate(payload: Dict[str, Any]) -> Dict[str, Any]:
    return generate_ai_insight(payload)
