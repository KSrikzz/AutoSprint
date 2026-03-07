from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class TaskBase(BaseModel):
    title: str
    estimated_hours: int = 1
    status: str = "Todo"
    is_ready: bool = True
    category: Optional[str] = "General"
    priority: int = 1

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    model_config = ConfigDict(from_attributes=True)