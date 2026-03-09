from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import models
import schemas
import graph_engine
import os
from database import get_db
from ai_service import analyze_task_ai
from project_service import calculate_critical_path


app = FastAPI(
    title="AutoSprint API",
    description="Backend for the Autonomous Execution Intelligence System",
    version="1.0.0"
)

# Permissive CORS to prevent browser blocks during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/", response_model=HealthResponse)
def health_check():
    return {"status": "success", "message": "AutoSprint backend is operational."}

# ==========================================
# TASK OPERATIONS
# ==========================================

@app.post("/tasks/", response_model=schemas.Task)
async def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    ai_suggestions = await analyze_task_ai(task.title, task.description or "")
    
    task_data = task.model_dump()
    if not task_data.get("estimated_hours") or task_data.get("estimated_hours") == 1:
        task_data["estimated_hours"] = ai_suggestions.get("estimated_hours", 1)
    task_data["category"] = ai_suggestions.get("category", "General")
    task_data["priority"] = ai_suggestions.get("priority", 1)

    db_task = models.Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=List[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Task).offset(skip).limit(limit).all()

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.query(models.TaskDependency).filter(
        (models.TaskDependency.task_id == task_id) | 
        (models.TaskDependency.depends_on_id == task_id)
    ).delete()
    db.delete(db_task)
    db.commit()
    return {"status": "success", "message": f"Task {task_id} deleted."}

@app.patch("/tasks/{task_id}/complete", response_model=schemas.Task)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = "Done"
    db.commit()
    db.refresh(db_task)
    return db_task

# ==========================================
# PROJECT INTELLIGENCE (GRAPH)
# ==========================================

@app.get("/project/critical-path", response_model=List[schemas.Task])
def get_critical_path(db: Session = Depends(get_db)):
    """Calculates the sequence of tasks determining the project duration"""
    try:
        path = calculate_critical_path(db)
        return path if path else []
    except Exception as e:
        print(f"Graph Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calculating project bottleneck.")

@app.get("/project/priorities", response_model=List[schemas.Task])
def get_prioritized_tasks(db: Session = Depends(get_db)):
    """Returns tasks sorted by AI-generated risk priority"""
    try:
        return db.query(models.Task).order_by(models.Task.priority.desc()).all()
    except Exception as e:
        print(f"Priority Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database sync error while fetching priorities.")

@app.post("/dependencies/", response_model=schemas.TaskDependency)
def create_dependency(dep: schemas.TaskDependencyCreate, db: Session = Depends(get_db)):
    """Establishes relationship links between tasks"""
    if dep.task_id == dep.depends_on_id:
        raise HTTPException(status_code=400, detail="A task cannot block itself.")
    
    db_dep = models.TaskDependency(**dep.model_dump())
    db.add(db_dep)
    db.commit()
    db.refresh(db_dep)
    return db_dep