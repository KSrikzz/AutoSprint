from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import models
import schemas
import graph_engine
from database import engine, get_db


app = FastAPI(
    title="AutoSprint API",
    description="Backend for the Autonomous Execution Intelligence System",
    version="1.0.0"
)

# Permissive CORS to prevent browser blocks during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.model_dump())
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
    db.delete(db_task)
    db.commit()
    return {"status": "success", "message": f"Task {task_id} deleted."}

@app.patch("/tasks/{task_id}/complete")
def complete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_task.status = "Done"
    db.commit()
    db.refresh(db_task)
    return {"status": "success", "message": f"Task '{db_task.title}' marked as Done."}

# ==========================================
# PROJECT INTELLIGENCE (GRAPH)
# ==========================================

@app.post("/tasks/{task_id}/dependencies/{prereq_id}")
def add_dependency(task_id: int, prereq_id: int, db: Session = Depends(get_db)):
    if task_id == prereq_id:
        raise HTTPException(status_code=400, detail="A task cannot depend on itself.")

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    prereq = db.query(models.Task).filter(models.Task.id == prereq_id).first()

    if not task or not prereq:
        raise HTTPException(status_code=404, detail="Task or prerequisite not found.")

    all_tasks = db.query(models.Task).all()
    if graph_engine.creates_cycle(all_tasks, task_id, prereq_id):
        raise HTTPException(status_code=400, detail="Dependency creates a cycle!")

    task.prerequisites.append(prereq)
    db.commit()
    return {"status": "success", "message": "Dependency established."}

@app.get("/project/critical-path")
def get_critical_path(db: Session = Depends(get_db)):
    try:
        active_tasks = db.query(models.Task).filter(models.Task.status != "Done").all()
        
        if not active_tasks:
            return {"status": "success", "total_sprint_hours": 0, "critical_path_ids": []}

        cp_data = graph_engine.calculate_critical_path(active_tasks)
        
        return {
            "status": "success",
            "total_sprint_hours": cp_data.get("total_hours", 0),
            "critical_path_ids": cp_data.get("critical_path_ids", [])
        }
    except Exception as e:
        print(f"Graph Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Graph Engine Error")

@app.get("/project/priorities")
def get_prioritized_tasks(db: Session = Depends(get_db)):
    try:
        all_tasks = db.query(models.Task).all()
        if not all_tasks:
            return {"status": "success", "prioritized_tasks": []}
            
        active_tasks = [t for t in all_tasks if t.status != "Done"]
        priorities = graph_engine.get_task_priorities(active_tasks)
        
        result = []
        for task in all_tasks:
            is_ready = all(p.status == "Done" for p in task.prerequisites)
            
            result.append({
                "id": task.id,
                "title": task.title,
                "priority": priorities.get(task.id, "Normal") if task.status != "Done" else "Completed",
                "estimated_hours": task.estimated_hours,
                "status": task.status,
                "is_ready": is_ready
            })
            
        priority_weights = {"Critical (Bottleneck)": 1, "High (Blocker)": 2, "Normal": 3, "Completed": 4}
        result.sort(key=lambda x: (x["status"] == "Done", priority_weights.get(x["priority"], 3)))
        
        return {"status": "success", "prioritized_tasks": result}
    except Exception as e:
        print(f"Priority Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Calculation Error")