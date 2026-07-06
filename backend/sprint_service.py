from sqlalchemy.orm import Session
from datetime import date, timedelta
from models import Sprint, Task, Notification
import logging

logger = logging.getLogger(__name__)


def auto_assign_tasks(db: Session, sprint_id: int) -> dict:
    """Greedy bin-packing: assigns unassigned tasks to a sprint by priority
    until velocity is exhausted. Returns assignment summary."""

    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        return {"error": "Sprint not found"}

    assigned_tasks = db.query(Task).filter(Task.sprint_id == sprint_id).all()
    used_hours = sum(t.estimated_hours for t in assigned_tasks)
    remaining_capacity = sprint.velocity - used_hours

    if remaining_capacity <= 0:
        return {"assigned": 0, "message": "Sprint is at full capacity."}

    unassigned = db.query(Task).filter(
        Task.project_id == sprint.project_id,
        Task.sprint_id.is_(None),
        Task.status != "Done"
    ).order_by(Task.priority.desc(), Task.estimated_hours.asc()).all()

    assigned_count = 0
    for task in unassigned:
        if task.estimated_hours <= remaining_capacity:
            task.sprint_id = sprint_id
            remaining_capacity -= task.estimated_hours
            assigned_count += 1

        if remaining_capacity <= 0:
            break

    db.commit()

    return {
        "assigned": assigned_count,
        "hours_used": sprint.velocity - remaining_capacity,
        "hours_remaining": remaining_capacity,
        "message": f"Assigned {assigned_count} tasks to sprint."
    }


def get_sprint_burndown(db: Session, sprint_id: int) -> list:
    """Calculate burndown data for a sprint.
    Returns list of {date, ideal, actual} points."""

    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        return []

    tasks = db.query(Task).filter(Task.sprint_id == sprint_id).all()
    if not tasks:
        return []

    total_hours = sum(t.estimated_hours for t in tasks)
    start = sprint.start_date
    end = sprint.end_date
    total_days = (end - start).days
    if total_days <= 0:
        return []

    points = []
    today = date.today()

    for day_offset in range(total_days + 1):
        current_date = start + timedelta(days=day_offset)

        ideal = total_hours * (1 - day_offset / total_days)

        if current_date <= today:
            completed_hours = sum(
                t.estimated_hours for t in tasks
                if t.status == "Done"
            )
            actual = total_hours - completed_hours
        else:
            actual = points[-1]["actual"] if points else total_hours

        points.append({
            "date": current_date.isoformat(),
            "ideal": round(ideal, 1),
            "actual": round(actual, 1)
        })

    return points


def get_sprint_stats(db: Session, sprint: Sprint) -> dict:
    """Calculate sprint statistics."""
    tasks = db.query(Task).filter(Task.sprint_id == sprint.id).all()
    total_hours = sum(t.estimated_hours for t in tasks)
    done_hours = sum(t.estimated_hours for t in tasks if t.status == "Done")
    done_count = sum(1 for t in tasks if t.status == "Done")

    return {
        "id": sprint.id,
        "name": sprint.name,
        "project_id": sprint.project_id,
        "start_date": sprint.start_date,
        "end_date": sprint.end_date,
        "velocity": sprint.velocity,
        "status": sprint.status,
        "task_count": len(tasks),
        "hours_used": total_hours,
        "hours_remaining": sprint.velocity - total_hours,
        "completion_pct": round((done_count / len(tasks) * 100) if tasks else 0, 1)
    }


def check_sprint_deadlines(db: Session) -> list:
    """Find sprints ending within 48 hours and create notifications."""
    threshold = date.today() + timedelta(hours=48)
    ending_sprints = db.query(Sprint).filter(
        Sprint.status == "active",
        Sprint.end_date <= threshold,
        Sprint.end_date >= date.today()
    ).all()

    notifications_created = []
    for sprint in ending_sprints:
        tasks = db.query(Task).filter(Task.sprint_id == sprint.id).all()
        user_ids = set(t.assigned_to_id for t in tasks if t.assigned_to_id)

        for user_id in user_ids:
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.type == "sprint_ending",
                Notification.message.contains(f"Sprint '{sprint.name}'")
            ).first()

            if not existing:
                notification = Notification(
                    user_id=user_id,
                    type="sprint_ending",
                    message=f"Sprint '{sprint.name}' is ending on {sprint.end_date.isoformat()}!"
                )
                db.add(notification)
                notifications_created.append(notification)

    if notifications_created:
        db.commit()

    return notifications_created
