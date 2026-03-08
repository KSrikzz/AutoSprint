from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    estimated_hours: int = 1
    status: str = "Todo"
    is_ready: bool = True
    category: Optional[str] = "General"
    priority: int = 1

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

class TaskDependencyBase(BaseModel):
    task_id: int
    depends_on_id: int

class TaskDependencyCreate(TaskDependencyBase):
    pass

class TaskDependency(TaskDependencyBase):
    id: int

    class Config:
        from_attributes = True