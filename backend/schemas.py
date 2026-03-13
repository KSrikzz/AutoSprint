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
    dependencies: List['Task'] = []

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

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None