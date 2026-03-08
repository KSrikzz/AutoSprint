from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    estimated_hours = Column(Integer, default=1)
    status = Column(String, default="Todo")
    is_ready = Column(Boolean, default=True)
    category = Column(String, nullable=True, default="General")
    priority = Column(Integer, default=1)

    dependencies = relationship(
        "Task",
        secondary="task_dependencies",
        primaryjoin="Task.id==TaskDependency.task_id",
        secondaryjoin="Task.id==TaskDependency.depends_on_id",
        backref="blocked_tasks"
    )

class TaskDependency(Base):
    __tablename__ = "task_dependencies"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    depends_on_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)