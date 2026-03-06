from sqlalchemy import Column, Integer, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

task_dependencies = Table(
    'task_dependencies',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id'), primary_key=True),
    Column('prerequisite_id', Integer, ForeignKey('tasks.id'), primary_key=True)
)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    is_ready = Column(Boolean, default=False)
    estimated_hours = Column(Integer, default=0)
    prerequisites = relationship(
        "Task",
        secondary=task_dependencies,
        primaryjoin=id==task_dependencies.c.task_id,
        secondaryjoin=id==task_dependencies.c.prerequisite_id,
        backref="dependent_tasks"
    )