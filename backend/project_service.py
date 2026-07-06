from sqlalchemy.orm import Session
from models import Task, TaskDependency
from collections import deque, defaultdict

def calculate_critical_path(db: Session):
    tasks = db.query(Task).all()
    dependencies = db.query(TaskDependency).all()

    graph = defaultdict(list)
    in_degree = {t.id: 0 for t in tasks}
    task_map = {t.id: t for t in tasks}
    
    for dep in dependencies:
        if dep.task_id in in_degree and dep.depends_on_id in in_degree:
            graph[dep.depends_on_id].append(dep.task_id)
            in_degree[dep.task_id] += 1

    queue = deque([t_id for t_id, degree in in_degree.items() if degree == 0])
    critical_path = []

    while queue:
        current_id = queue.popleft()
        critical_path.append(task_map[current_id])
        
        for neighbor in graph[current_id]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    return critical_path