from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AutoSprint API",
    description="Backend for the Autonomous Execution Intelligence System",
    version="1.0.0"
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
def health_check():
    return {
        "status": "success",
        "message": "AutoSprint FastAPI backend is up and running!"
    }

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "success", "message": "Successfully connected to PostgreSQL!"}
    except Exception as e:
        return {"status": "error", "message": f"Database connection failed: {str(e)}"}