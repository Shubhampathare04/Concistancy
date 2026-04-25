from datetime import date, datetime
from typing import List
from sqlalchemy.orm import Session
from app.models.models import Task, TaskCompletion, Streak, UserStats, ActivityLog
from app.schemas.schemas import TaskCreate, TaskOut, DashboardOut
from app.services.ai_service import calculate_xp, update_streak, get_suggestions

def create_task(user_id: int, data: TaskCreate, db: Session) -> TaskOut:
    task = Task(user_id=user_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskOut.model_validate(task)

def get_user_tasks(user_id: int, db: Session) -> List[TaskOut]:
    tasks = db.query(Task).filter(Task.user_id == user_id, Task.is_active == True).all()
    return [TaskOut.model_validate(t) for t in tasks]

def complete_task(user_id: int, task_id: int, db: Session):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    completion = TaskCompletion(task_id=task_id, user_id=user_id, completed_at=datetime.utcnow())
    db.add(completion)

    # Update streak
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    today = date.today()
    action = update_streak(streak.last_completed_date, today)
    if action == "increment":
        streak.current_streak += 1
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    elif action == "reset":
        streak.current_streak = 1
    streak.last_completed_date = today

    # Update XP
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    stats.xp += calculate_xp(task.difficulty, consistency_bonus=streak.current_streak)
    stats.level = max(1, stats.xp // 100)

    db.add(ActivityLog(user_id=user_id, action_type="task_complete", meta={"task_id": task_id}))
    db.commit()
    return {"status": "completed", "xp_gained": calculate_xp(task.difficulty)}

def get_dashboard(user_id: int, db: Session) -> DashboardOut:
    tasks = get_user_tasks(user_id, db)
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()

    total = db.query(TaskCompletion).filter(TaskCompletion.user_id == user_id).count()
    failed = len(tasks) - total if len(tasks) > total else 0
    fail_rate = failed / len(tasks) if tasks else 0

    return DashboardOut(
        tasks=tasks,
        streak=streak.current_streak if streak else 0,
        xp=stats.xp if stats else 0,
        level=stats.level if stats else 1,
        suggestions=get_suggestions(fail_rate, None),
    )
