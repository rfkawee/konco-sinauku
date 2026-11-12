import json
import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

is_postgres = settings.DATABASE_URL.startswith("postgres") or settings.DATABASE_URL.startswith("postgresql")

# Koneksi Engine
if is_postgres:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )
else:
    # SQLite fallback untuk local development
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Inisialisasi tabel dan ekstensi vector jika postgres."""
    try:
        if is_postgres:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("Ekstensi pgvector di PostgreSQL berhasil diinisialisasi.")
        
        # Buat seluruh tabel yang didefinisikan di db_models
        from app.models import db_models
        Base.metadata.create_all(bind=engine)
        logger.info("Tabel-tabel database berhasil dibuat/dimuat.")
    except Exception as e:
        logger.error(f"Gagal menginisialisasi database: {e}")
        raise e

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
