from sqlalchemy.orm import Session
from models import Notification, ActivityLog, Task, User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def create_notification(db: Session, user_id: int, notif_type: str, message: str) -> Notification:
    """Create and persist a notification."""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        message=message
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def log_activity(db: Session, task_id: int, user_id: int, action: str, detail: str = None) -> ActivityLog:
    """Log an activity for a task."""
    log = ActivityLog(
        task_id=task_id,
        user_id=user_id,
        action=action,
        detail=detail,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def notify_task_assigned(db: Session, task: Task, assignee_id: int, actor_name: str):
    """Notify a user that a task has been assigned to them."""
    if assignee_id:
        create_notification(
            db,
            user_id=assignee_id,
            notif_type="task_assigned",
            message=f"'{task.title}' has been assigned to you by {actor_name}."
        )


def notify_status_changed(db: Session, task: Task, old_status: str, new_status: str, actor_id: int):
    """Notify relevant users about a task status change."""
    if task.assigned_to_id and task.assigned_to_id != actor_id:
        create_notification(
            db,
            user_id=task.assigned_to_id,
            notif_type="status_changed",
            message=f"'{task.title}' moved from {old_status} → {new_status}."
        )


def get_unread_notifications(db: Session, user_id: int) -> list:
    """Get all unread notifications for a user."""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).all()


def mark_notification_read(db: Session, notification_id: int, user_id: int) -> bool:
    """Mark a notification as read. Returns True if successful."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False


def mark_all_read(db: Session, user_id: int) -> int:
    """Mark all notifications as read for a user. Returns count updated."""
    count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return count
