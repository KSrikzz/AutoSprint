from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
import schemas
import graph_engine
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
    
# ==========================================
# CRUD ENDPOINTS FOR TASKS
# ==========================================

# 1. CREATE a new task
@app.post("/tasks/", response_model=schemas.Task)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    # Convert Pydantic schema to SQLAlchemy model dictionary
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

# 2. READ all tasks
@app.get("/tasks/", response_model=list[schemas.Task])
def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).offset(skip).limit(limit).all()
    return tasks

# 3. READ a single task by ID
@app.get("/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# 4. UPDATE a task
@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task.model_dump().items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

# 5. DELETE a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"status": "success", "message": f"Task {task_id} deleted successfully"}

# ==========================================
# DEPENDENCY & GRAPH ENDPOINTS
# ==========================================

@app.post("/tasks/{task_id}/dependencies/{prereq_id}")
def add_dependency(task_id: int, prereq_id: int, db: Session = Depends(get_db)):
    # 1. Basic validation
    if task_id == prereq_id:
        raise HTTPException(status_code=400, detail="A task cannot depend on itself.")

    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    prereq = db.query(models.Task).filter(models.Task.id == prereq_id).first()

    if not task or not prereq:
        raise HTTPException(status_code=404, detail="Task or prerequisite not found.")

    if prereq in task.prerequisites:
        return {"message": "Dependency already exists."}

    # 2. Graph Engine Validation (Cycle Detection)
    all_tasks = db.query(models.Task).all()
    
    if graph_engine.creates_cycle(all_tasks, task_id, prereq_id):
        # If invalid: Reject output
        raise HTTPException(
            status_code=400, 
            detail="Invalid execution path: This dependency creates a cycle in the DAG!"
        )

    # 3. Save the valid dependency
    task.prerequisites.append(prereq)
    db.commit()

    return {
        "status": "success", 
        "message": f"Task {prereq_id} '{prereq.title}' is now a strict prerequisite for Task {task_id} '{task.title}'"
    }

@app.get("/project/critical-path")
def get_critical_path(db: Session = Depends(get_db)):
    all_tasks = db.query(models.Task).all()
    
    cp_data = graph_engine.calculate_critical_path(all_tasks)
    
    critical_tasks = []
    for task_id in cp_data["critical_path_ids"]:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if task:
            critical_tasks.append({
                "id": task.id,
                "title": task.title,
                "estimated_hours": task.estimated_hours
            })
            
    return {
        "status": "success",
        "total_sprint_hours": cp_data["total_hours"],
        "critical_path": critical_tasks
    }

@app.get("/project/priorities")
def get_prioritized_tasks(db: Session = Depends(get_db)):
    all_tasks = db.query(models.Task).all()
    
    # Calculate priorities
    priorities = graph_engine.get_task_priorities(all_tasks)
    
    result = []
    for task in all_tasks:
        result.append({
            "id": task.id,
            "title": task.title,
            "priority": priorities.get(task.id, "Normal"),
            "estimated_hours": task.estimated_hours,
            "is_ready": task.is_ready
        })
        
    # Sort the tasks
    priority_weights = {"Critical (Bottleneck)": 1, "High (Blocker)": 2, "Normal": 3}
    result.sort(key=lambda x: priority_weights.get(x["priority"], 3))
    
    return {
        "status": "success",
        "prioritized_tasks": result
    }