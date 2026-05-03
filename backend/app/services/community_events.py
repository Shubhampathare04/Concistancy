"""
Community event handlers — auto-post system messages to groups
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.events import on, TASK_COMPLETED
from app.models.models import GroupMember, GroupMessage, User


@on(TASK_COMPLETED)
def post_completion_to_groups(event: dict):
    """When user completes a task, post system message to all their groups."""
    db: Session = event["db"]
    user_id = event["user_id"]
    task_title = event.get("task_title", "a task")
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    # Get all groups user is member of
    memberships = db.query(GroupMember).filter(
        GroupMember.user_id == user_id,
        GroupMember.is_active == True
    ).all()
    
    for membership in memberships:
        # Post system message
        message = GroupMessage(
            group_id=membership.group_id,
            sender_id=user_id,
            content=f"{user.username} completed '{task_title}' 🔥",
            message_type="system",
            created_at=datetime.utcnow()
        )
        db.add(message)
    
    db.flush()


def post_group_join_message(group_id: int, user_id: int, username: str, db: Session):
    """Post welcome message when user joins group."""
    message = GroupMessage(
        group_id=group_id,
        sender_id=user_id,
        content=f"{username} joined the group 👋",
        message_type="system",
        created_at=datetime.utcnow()
    )
    db.add(message)
    db.flush()


def post_challenge_completion_message(group_id: int, user_id: int, username: str, challenge_title: str, reward_coins: int, db: Session):
    """Post achievement message when user completes a group challenge."""
    message = GroupMessage(
        group_id=group_id,
        sender_id=user_id,
        content=f"{username} completed challenge '{challenge_title}'! 🏆 Earned {reward_coins} coins",
        message_type="achievement",
        created_at=datetime.utcnow()
    )
    db.add(message)
    db.flush()
