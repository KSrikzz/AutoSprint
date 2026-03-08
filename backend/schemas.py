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