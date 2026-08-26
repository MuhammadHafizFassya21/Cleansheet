import unittest

import pandas as pd

from app.models.manual_review import ManualEditRequest
from app.routers.manual_review import _resolve_acknowledged_keys
from app.services import manual_review_service, quality_gate_service


class ManualReviewRegressionTests(unittest.TestCase):
    def test_integer_manual_edit_is_coerced(self):
        df = pd.DataFrame({"total_spent": [10]})
        result = manual_review_service.apply_manual_edits(
            df,
            [ManualEditRequest(row_index=1, column="total_spent", new_value="100")],
        )
        self.assertEqual(result.at[0, "total_spent"], 100)
        self.assertEqual(result["total_spent"].dtype, df["total_spent"].dtype)

    def test_float_manual_edit_is_coerced(self):
        df = pd.DataFrame({"total_spent": [10.0]})
        result = manual_review_service.apply_manual_edits(
            df,
            [ManualEditRequest(row_index=1, column="total_spent", new_value="100.50")],
        )
        self.assertEqual(result.at[0, "total_spent"], 100.50)

    def test_invalid_numeric_edit_is_rejected(self):
        df = pd.DataFrame({"total_spent": [10]})
        with self.assertRaises(ValueError):
            manual_review_service.apply_manual_edits(
                df,
                [ManualEditRequest(row_index=1, column="total_spent", new_value="abc")],
            )

    def test_acknowledgement_is_limited_to_pending_stable_keys(self):
        df = pd.DataFrame(
            {
                "email": ["bad-email"],
                "total_spent": [-10],
            }
        )
        pending = manual_review_service.get_manual_review_issues(df)
        negative_key = next(
            issue.stable_key
            for issue in pending
            if issue.type == "suspicious_negative_number"
        )
        email_key = next(
            issue.stable_key for issue in pending if issue.type == "invalid_email"
        )

        resolved = _resolve_acknowledged_keys(
            [negative_key, "999:total_spent:suspicious_negative_number"], pending
        )
        self.assertEqual(resolved, {negative_key})

        _, gate = quality_gate_service.run_quality_gate(
            df, acknowledged_issue_keys=resolved, apply_safety_net=True
        )
        blocking_types = {issue.type for issue in gate.blocking_issues}
        self.assertNotIn("suspicious_negative_number", blocking_types)
        self.assertIn("invalid_email", blocking_types)
        self.assertFalse(gate.passed)


if __name__ == "__main__":
    unittest.main()
