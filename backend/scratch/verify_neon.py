import os
import sys

from app.config import settings
from app.db.database import get_db_connection, run_migrations
from psycopg.rows import dict_row

print("1. DATABASE_URL DETECTED:", "PASS" if bool(settings.DATABASE_URL and settings.DATABASE_URL.strip()) else "FAIL")

try:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            res = cur.fetchone()
            print("2. NEON CONNECTION:", "PASS" if res == (1,) else "FAIL")
            print("3. SELECT 1:", "PASS" if res == (1,) else "FAIL")
except Exception as e:
    print("2. NEON CONNECTION: FAIL", type(e).__name__)
    print("3. SELECT 1: FAIL", type(e).__name__)

try:
    migrated = run_migrations()
    print("4. MIGRATION:", "PASS" if migrated else "FAIL")
except Exception as e:
    print("4. MIGRATION: FAIL", type(e).__name__, str(e))

try:
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('datasets', 'downloads');")
            tables = {r['table_name'] for r in cur.fetchall()}
            print("5. DATASETS TABLE:", "PASS" if 'datasets' in tables else "FAIL")
            print("6. DOWNLOADS TABLE:", "PASS" if 'downloads' in tables else "FAIL")

            cur.execute("SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('datasets', 'downloads');")
            indexes = {r['indexname'] for r in cur.fetchall()}
            expected_indexes = {
                'datasets_expires_at_idx',
                'datasets_parent_dataset_id_idx',
                'datasets_stage_idx',
                'downloads_dataset_id_idx',
                'downloads_expires_at_idx'
            }
            has_indexes = expected_indexes.issubset(indexes)
            print("7. INDEXES:", "PASS" if has_indexes else "FAIL")
            print("   Found Indexes:", sorted(list(indexes)))
except Exception as e:
    print("5. DATASETS TABLE: FAIL", type(e).__name__, str(e))
    print("6. DOWNLOADS TABLE: FAIL", type(e).__name__, str(e))
    print("7. INDEXES: FAIL", type(e).__name__, str(e))
