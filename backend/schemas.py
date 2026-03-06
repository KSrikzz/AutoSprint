from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_ready: bool = False
    estimated_hours: int = 0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    pass

class TaskMinimal(TaskBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Task(TaskBase):
    id: int
    prerequisites: List[TaskMinimal] = []
    model_config = ConfigDict(from_attributes=True)