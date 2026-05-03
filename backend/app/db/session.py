from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Production-ready connection pool configuration
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,              # Minimum connections in pool
    max_overflow=40,           # Additional connections when pool exhausted
    pool_pre_ping=True,        # Verify connections before using
    pool_recycle=3600,         # Recycle connections after 1 hour
    echo=False,                # Disable SQL logging in production
    pool_timeout=30,           # Wait 30s for connection before timeout
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
