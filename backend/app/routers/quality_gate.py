from fastapi import APIRouter, HTTPException, Path

from ..services import dataset_store, quality_gate_service

router = APIRouter()


@router.get("/{dataset_id}")
def check_dataset_quality_gate(dataset_id: str = Path(...)):
    """Run strict quality gate on a stored dataset (e.g. before report/export)."""
    stored = dataset_store.get_dataset(dataset_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Dataset not found or expired.")

    final_df, gate = quality_gate_service.run_quality_gate(
        stored["df"],
        acknowledged_issue_keys=quality_gate_service.acknowledged_keys_for_dataset(stored),
        apply_safety_net=True,
    )

    return {
        "dataset_id": dataset_id,
        "file_name": stored.get("file_name"),
        "stage": stored.get("stage"),
        **gate.to_summary_dict(),
        "blocking_issues": [
            {
                "stable_key": quality_gate_service.issue_stable_key(i),
                "type": i.type,
                "severity": i.severity,
                "row_index": i.row_index,
                "column": i.column,
                "message": i.message,
            }
            for i in gate.blocking_issues[:50]
        ],
    }
