from sqlalchemy import create_engine
from .config import settings

def get_engine():
    db_url = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    engine = create_engine(db_url)
    return engine

def check_connection():
    try:
        engine = get_engine()
        with engine.connect() as conn:
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False
