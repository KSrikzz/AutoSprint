from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import models
import schemas
import graph_engine
import os
import auth_service
from database import get_db
from ai_service import analyze_task_ai
from project_service import calculate_critical_path
from jose import JWTError, jwt

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/form")

# ==========================================
# AUTHENTICATION DEPENDENCIES
# ==========================================

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation restricted to administrators only."
        )
    return current_user

# ==========================================
# AUTH ENDPOINTS
# ==========================================

@app.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = auth_service.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=models.UserRole.USER
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login_json(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not auth_service.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth_service.create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": db_user.role,
        "username": db_user.username
    }

@app.post("/auth/login/form", response_model=schemas.Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not db_user or not auth_service.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = auth_service.create_access_token(data={"sub": db_user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": db_user.role,
        "username": db_user.username
    }

# ==========================================
# SYSTEM STARTUP
# ==========================================

@app.on_event("startup")
def create_initial_admin():
    from database import SessionLocal
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            print("Creating initial admin user...")
            admin_user = models.User(
                username="admin",
                hashed_password=auth_service.get_password_hash(os.getenv("ADMIN_PASSWORD", "admin123")),
                role=models.UserRole.ADMIN
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

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
async def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
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
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    return db.query(models.Task).offset(skip).limit(limit).all()

@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
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
def complete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    unfinished = [t.title for t in db_task.dependencies if t.status != "Done"]
    if unfinished:
        raise HTTPException(
            status_code=400, 
            detail=f"Blocked! Prerequisite tasks not finished: {', '.join(unfinished)}"
        )
    
    db_task.status = "Done"
    db.commit()
    db.refresh(db_task)
    return db_task

# ==========================================
# PROJECT INTELLIGENCE (GRAPH)
# ==========================================

@app.get("/project/critical-path", response_model=List[schemas.Task])
def get_critical_path(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """Calculates the sequence of tasks determining the project duration using graph engine"""
    try:
        tasks = db.query(models.Task).all()
        if not tasks:
            return []
        
        cp_data = graph_engine.calculate_critical_path(tasks)
        cp_ids = cp_data.get("critical_path_ids", [])
        
        # Maintain order from graph engine
        task_map = {t.id: t for t in tasks}
        path = [task_map[tid] for tid in cp_ids if tid in task_map]
        return path
    except Exception as e:
        print(f"Graph Engine Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calculating project bottleneck.")

@app.get("/project/priorities", response_model=List[schemas.Task])
def get_prioritized_tasks(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user)
):
    """Returns tasks sorted by AI-generated risk priority"""
    try:
        return db.query(models.Task).order_by(models.Task.priority.desc()).all()
    except Exception as e:
        print(f"Priority Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Database sync error while fetching priorities.")

@app.post("/dependencies/", response_model=schemas.TaskDependency)
def create_dependency(
    dep: schemas.TaskDependencyCreate, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    """Establishes relationship links between tasks"""
    if dep.task_id == dep.depends_on_id:
        raise HTTPException(status_code=400, detail="A task cannot block itself.")
    
    db_dep = models.TaskDependency(**dep.model_dump())
    db.add(db_dep)
    db.commit()
    db.refresh(db_dep)
    return db_dep
