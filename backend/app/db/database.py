import os
from contextlib import contextmanager
from typing import Generator

try:
    import psycopg
    from psycopg_pool import ConnectionPool
    HAS_PSYCOPG = True
except ImportError:
    HAS_PSYCOPG = False

from app.config import settings

_pool: Optional["ConnectionPool"] = None


def get_db_url() -> Optional[str]:
    """Retrieve DATABASE_URL from settings or environment."""
    return settings.DATABASE_URL or os.getenv("DATABASE_URL")


def init_db_pool(min_size: int = 1, max_size: int = 5) -> Optional["ConnectionPool"]:
    """
    Initialize a psycopg connection pool if DATABASE_URL is configured.
    For serverless FastAPI on Vercel, connections should use Neon's pooler host 
    or HTTP/WebSocket drivers in production if long-lived pools timeout.
    """
    global _pool
    db_url = get_db_url()
    if not db_url or not HAS_PSYCOPG:
        return None

    if _pool is None or _pool.closed:
        _pool = ConnectionPool(
            conninfo=db_url,
            min_size=min_size,
            max_size=max_size,
            kwargs={"autocommit": True}
        )
    return _pool


def close_db_pool() -> None:
    """Close the global connection pool if initialized."""
    global _pool
    if _pool is not None and not _pool.closed:
        _pool.close()
        _pool = None


@contextmanager
def get_db_connection() -> Generator:
    """
    Context manager to yield a database connection from the pool or a single connection.
    Raises ValueError if DATABASE_URL is not configured.
    """
    db_url = get_db_url()
    if not db_url:
        raise ValueError("DATABASE_URL is not set. Cannot establish database connection.")

    if not HAS_PSYCOPG:
        raise ImportError("psycopg library is not installed.")

    pool = init_db_pool()
    if pool is not None:
        with pool.connection() as conn:
            yield conn
    else:
        conn = psycopg.connect(db_url, autocommit=True)
        try:
            yield conn
        finally:
            conn.close()


def run_migrations(migration_file_path: Optional[str] = None) -> bool:
    """
    Execute SQL schema migrations against the configured Neon PostgreSQL database.
    """
    if migration_file_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        migration_file_path = os.path.join(current_dir, "migrations", "001_initial_schema.sql")

    if not os.path.exists(migration_file_path):
        raise FileNotFoundError(f"Migration file not found: {migration_file_path}")

    with open(migration_file_path, "r", encoding="utf-8") as f:
        sql_script = f.read()

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql_script)
    return True
