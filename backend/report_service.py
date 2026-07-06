from sqlalchemy.orm import Session
from models import Sprint, Task, User
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from io import BytesIO
from collections import Counter
import os
import logging

logger = logging.getLogger(__name__)

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")


def generate_sprint_pdf(db: Session, sprint_id: int) -> BytesIO:
    """Generate a PDF sprint summary report. Returns a BytesIO buffer."""

    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise ValueError("Sprint not found")

    tasks = db.query(Task).filter(Task.sprint_id == sprint_id).all()

    total_tasks = len(tasks)
    done_tasks = [t for t in tasks if t.status == "Done"]
    completion_pct = round((len(done_tasks) / total_tasks * 100) if total_tasks else 0, 1)
    total_estimated = sum(t.estimated_hours for t in tasks)
    done_estimated = sum(t.estimated_hours for t in done_tasks)

    task_rows = []
    for t in sorted(tasks, key=lambda x: x.priority, reverse=True):
        assignee = None
        if t.assigned_to_id:
            user = db.query(User).filter(User.id == t.assigned_to_id).first()
            assignee = user.username if user else "Unknown"

        task_rows.append({
            "title": t.title,
            "category": t.category or "General",
            "status": t.status,
            "priority": t.priority,
            "estimated_hours": t.estimated_hours,
            "assignee": assignee or "Unassigned"
        })

    env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template("sprint_report.html")

    html_content = template.render(
        sprint_name=sprint.name,
        start_date=sprint.start_date.isoformat(),
        end_date=sprint.end_date.isoformat(),
        velocity=sprint.velocity,
        status=sprint.status,
        total_tasks=total_tasks,
        done_count=len(done_tasks),
        completion_pct=completion_pct,
        total_estimated=total_estimated,
        done_estimated=done_estimated,
        tasks=task_rows
    )

    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)

    return pdf_buffer
