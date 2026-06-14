from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from config import settings


class Base(DeclarativeBase):
    pass


connect_args: dict[str, object] = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 10

from sqlalchemy.pool import QueuePool

# Use QueuePool for SQLite to keep connections open without sharing a single connection
# across multiple threads, which causes InterfaceError and database locks.
pool_kwargs = {}
if settings.database_url.startswith("sqlite"):
    pool_kwargs["poolclass"] = QueuePool
    pool_kwargs["pool_size"] = 15
    pool_kwargs["max_overflow"] = 20

from sqlalchemy import event

engine = create_engine(settings.database_url, future=True, connect_args=connect_args, **pool_kwargs)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.database_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

def get_session() -> Generator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def init_db() -> None:
    import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Add new columns to existing tables (safe migration for SQLite)
    _migrate_columns()


def _migrate_columns() -> None:
    """Add new columns to existing tables if they don't already exist.
    Safe to run on every startup — uses ALTER TABLE IF NOT EXISTS pattern."""
    import logging
    logger = logging.getLogger(__name__)

    migrations = [
        # (table_name, column_name, column_type)
        ("facilities", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("vehicles", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("driver_profiles", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("objectives", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("shipments", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("sim_events", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("webhook_deliveries", "client_id", "INTEGER REFERENCES integration_clients(id)"),
        ("integration_clients", "password_hash", "VARCHAR(128)"),
        ("integration_clients", "company_name", "VARCHAR(255)"),
    ]

    with engine.connect() as conn:
        for table, column, col_type in migrations:
            try:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                    )
                )
                conn.commit()
            except Exception:
                pass  # Column already exists — SQLite doesn't have IF NOT EXISTS
