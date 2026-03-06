import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://admin:REDACTED@db:5432/autosprint"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={'connect_timeout': 5}
)

def wait_for_db(engine, retries=10, interval=3):
    print("⏳ Connecting to PostgreSQL...")
    while retries > 0:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                print("✅ Database connection established!")
                return
        except OperationalError as e:
            retries -= 1
            print(f"⚠️ Database not ready ({retries} retries left). Waiting {interval}s...")
            time.sleep(interval)
    
    raise Exception("❌ Could not connect to the database. Check docker-compose logs.")
wait_for_db(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()