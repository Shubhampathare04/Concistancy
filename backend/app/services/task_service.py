import json
from datetime import date, datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException

from app.models.models import Task, TaskCompletion, Streak, UserStats, ActivityLog, BehaviorScore
from app.schemas.schemas import (
    TaskCreate, TaskUpdate, TaskOut, DashboardOut,
    CompleteTaskRequest, CompleteTaskOut, PaginatedTasks, AIInsight
)
from app.services.ai_service import (
    calculate_xp, update_streak, get_suggestions,
    compute_consistency_index, generate_insights,
    get_best_completion_hour, get_best_day_of_week,
    compute_task_behavior_score,
)
from app.core.cache import cache_get, cache_set, cache_delete_pattern
from app.core.events import emit, TASK_CREATED, TASK_COMPLETED

DASHBOARD_TTL = 120   # 2 minutes
TASKS_TTL = 300       # 5 minutes


# ─── Tasks ───────────────────────────────────────────────────────────────────

def create_task(user_id: int, data: TaskCreate, db: Session) -> TaskOut:
    task = Task(user_id=user_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    cache_delete_pattern(f"dashboard:{user_id}:*")
    cache_delete_pattern(f"tasks:{user_id}:*")
    emit(TASK_CREATED, {
        "user_id":    user_id,
        "task_id":    task.id,
        "title":      task.title,
        "difficulty": task.difficulty,
        "db":         db,
    })
    db.commit()
    return TaskOut.model_validate(task)


def get_user_tasks(
    user_id: int,
    db: Session,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedTasks:
    cache_key = f"tasks:{user_id}:{page}:{page_size}"
    cached = cache_get(cache_key)
    if cached:
        data = json.loads(cached)
        return PaginatedTasks(**data)

    query = db.query(Task).options(
        joinedload(Task.completions)
    ).filter(
        Task.user_id == user_id,
        Task.is_active == True,
        Task.deleted_at == None
    )
    total = query.count()
    tasks = query.offset((page - 1) * page_size).limit(page_size).all()
    result = PaginatedTasks(
        items=[TaskOut.model_validate(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )
    cache_set(cache_key, result.model_dump_json(), TASKS_TTL)
    return result


def update_task(user_id: int, task_id: int, data: TaskUpdate, db: Session) -> TaskOut:
    task = _get_task_or_404(user_id, task_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    cache_delete_pattern(f"tasks:{user_id}:*")
    cache_delete_pattern(f"dashboard:{user_id}:*")
    # task_updated is low-signal — log directly, no fan-out needed
    db.add(ActivityLog(user_id=user_id, action_type="TASK_UPDATED", meta={"task_id": task_id}))
    db.commit()
    return TaskOut.model_validate(task)


def delete_task(user_id: int, task_id: int, db: Session) -> None:
    task = _get_task_or_404(user_id, task_id, db)
    task.deleted_at = datetime.utcnow()
    task.is_active = False
    db.add(ActivityLog(user_id=user_id, action_type="TASK_DELETED", meta={"task_id": task_id}))
    db.commit()
    cache_delete_pattern(f"tasks:{user_id}:*")
    cache_delete_pattern(f"dashboard:{user_id}:*")


def complete_task(
    user_id: int,
    task_id: int,
    request: CompleteTaskRequest,
    db: Session,
) -> CompleteTaskOut:
    # Idempotency check
    existing = db.query(TaskCompletion).filter(
        TaskCompletion.idempotency_key == request.idempotency_key
    ).first()
    if existing:
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == user_id).first()
        return CompleteTaskOut(
            status="already_completed",
            xp_gained=0,
            new_streak=streak.current_streak if streak else 0,
            new_xp=stats.xp if stats else 0,
            new_level=stats.level if stats else 1,
            consistency_index=stats.consistency_index if stats else 0.0,
            level_up=False,
        )

    task = _get_task_or_404(user_id, task_id, db)

    completion = TaskCompletion(
        task_id=task_id,
        user_id=user_id,
        completed_at=datetime.utcnow(),
        duration_minutes=request.duration_minutes,
        idempotency_key=request.idempotency_key,
    )
    db.add(completion)

    # Update streak
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    today = date.today()
    action = update_streak(streak.last_completed_date, today)
    if action == "increment":
        streak.current_streak += 1
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        # Award streak shield at milestones
        if streak.current_streak in (7, 14, 30):
            streak.streak_shields = (streak.streak_shields or 0) + 1
    elif action == "reset":
        # Check recovery window
        now = datetime.utcnow()
        if streak.recovery_expires_at and streak.recovery_expires_at > now:
            # In recovery — check if 2 completions today
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            completions_today = db.query(TaskCompletion).filter(
                TaskCompletion.user_id == user_id,
                TaskCompletion.completed_at >= today_start,
            ).count()
            if completions_today >= 1:  # this completion makes it 2 (current not yet committed)
                streak.current_streak = max(streak.current_streak, 1)
                streak.recovery_expires_at = None
            # else still in recovery, don't reset yet
        else:
            # Set recovery window for 24h
            streak.recovery_expires_at = datetime.utcnow() + timedelta(hours=24)
            streak.current_streak = 1
    streak.last_completed_date = today

    # Compute consistency index
    db.flush()
    ci = compute_consistency_index(user_id, db)

    # Update XP
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    old_level = stats.level
    xp_gained = calculate_xp(
        difficulty=task.difficulty,
        streak=streak.current_streak,
        consistency_index=ci,
        duration_minutes=request.duration_minutes,
        estimated_minutes=task.estimated_minutes,
    )
    # Apply XP multiplier if active window exists
    from app.models.models import XPMultiplierWindow
    multiplier_window = db.query(XPMultiplierWindow).filter(
        XPMultiplierWindow.user_id == user_id,
        XPMultiplierWindow.starts_at <= datetime.utcnow(),
        XPMultiplierWindow.ends_at > datetime.utcnow(),
    ).first()
    if multiplier_window:
        xp_gained = int(xp_gained * multiplier_window.multiplier)

    stats.xp += xp_gained
    stats.level = max(1, stats.xp // 100)
    stats.consistency_index = ci
    stats.total_completions = (stats.total_completions or 0) + 1
    stats.coins = (stats.coins or 0) + task.difficulty

    level_up = stats.level > old_level

    # Check + update personal records
    from app.models.models import PersonalRecord
    _check_personal_records(user_id, task_id, request.duration_minutes, task.estimated_minutes, db)

    # Check coin tier upgrade
    from app.services.rank_service import get_coin_tier, COIN_TIERS
    old_coins = (stats.coins or 0)
    new_coins = old_coins + task.difficulty
    old_tier = get_coin_tier(old_coins).tier
    new_tier = get_coin_tier(new_coins).tier
    coin_tier_up = old_tier != new_tier

    # Check badge unlock
    from app.services.rank_service import get_earned_badges
    ci_now = ci
    old_badges = set(get_earned_badges(stats, streak.current_streak - 1, ci_now, old_coins))
    new_badges = set(get_earned_badges(stats, streak.current_streak, ci_now, new_coins))
    new_badge_keys = new_badges - old_badges

    # Emit TASK_COMPLETED — fans out to AI engine, analytics, notification engine
    emit(TASK_COMPLETED, {
        "user_id":           user_id,
        "task_id":           task_id,
        "task_title":        task.title,
        "xp_gained":         xp_gained,
        "new_level":         stats.level,
        "streak":            streak.current_streak,
        "consistency_index": ci,
        "duration_minutes":  request.duration_minutes,
        "level_up":          level_up,
        "coin_tier_up":      coin_tier_up,
        "new_tier":          new_tier,
        "new_coins":         new_coins,
        "new_badge_keys":    list(new_badge_keys),
        "db":                db,  # analytics handler writes ActivityLog inline
    })

    db.commit()
    cache_delete_pattern(f"dashboard:{user_id}:*")
    cache_delete_pattern(f"tasks:{user_id}:*")

    return CompleteTaskOut(
        status="completed",
        xp_gained=xp_gained,
        new_streak=streak.current_streak,
        new_xp=stats.xp,
        new_level=stats.level,
        consistency_index=ci,
        level_up=level_up,
    )


# ─── Dashboard ───────────────────────────────────────────────────────────────

def get_dashboard(user_id: int, db: Session) -> DashboardOut:
    cache_key = f"dashboard:{user_id}:v2"
    cached = cache_get(cache_key)
    if cached:
        return DashboardOut(**json.loads(cached))

    tasks_page = get_user_tasks(user_id, db, page=1, page_size=50)
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()

    total = db.query(TaskCompletion).filter(TaskCompletion.user_id == user_id).count()
    task_count = tasks_page.total
    failed = max(task_count - total, 0)
    fail_rate = failed / task_count if task_count > 0 else 0.0

    best_hour = get_best_completion_hour(user_id, db)
    best_day = get_best_day_of_week(user_id, db)
    ci = stats.consistency_index if stats else 0.0

    raw_insights = generate_insights(
        user_id=user_id,
        consistency_index=ci,
        streak=streak.current_streak if streak else 0,
        fail_rate=fail_rate,
        best_hour=best_hour,
        best_day=best_day,
        db=db,
    )
    insights = [AIInsight(**i) for i in raw_insights]

    result = DashboardOut(
        tasks=tasks_page.items,
        streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        xp=stats.xp if stats else 0,
        level=stats.level if stats else 1,
        coins=stats.coins if stats else 0,
        consistency_index=ci,
        total_completions=stats.total_completions if stats else 0,
        insights=insights,
        suggestions=get_suggestions(fail_rate, best_hour),
    )

    cache_set(cache_key, result.model_dump_json(), DASHBOARD_TTL)
    return result


# ─── Sync ────────────────────────────────────────────────────────────────────

def process_sync_batch(user_id: int, actions: list, db: Session) -> dict:
    processed = 0
    failed = 0
    results = []

    for action in actions:
        try:
            result = _process_sync_action(user_id, action, db)
            results.append({"key": action.idempotency_key, "status": "ok", "result": result})
            processed += 1
        except Exception as e:
            results.append({"key": action.idempotency_key, "status": "error", "error": str(e)})
            failed += 1

    return {"processed": processed, "failed": failed, "results": results}


def _process_sync_action(user_id: int, action, db: Session):
    if action.action_type == "complete_task":
        return complete_task(
            user_id=user_id,
            task_id=action.payload["task_id"],
            request=CompleteTaskRequest(
                idempotency_key=action.idempotency_key,
                duration_minutes=action.payload.get("duration_minutes"),
            ),
            db=db,
        )
    elif action.action_type == "create_task":
        return create_task(
            user_id=user_id,
            data=TaskCreate(**action.payload),
            db=db,
        )
    else:
        raise ValueError(f"Unknown action type: {action.action_type}")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_task_or_404(user_id: int, task_id: int, db: Session) -> Task:
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == user_id,
        Task.deleted_at == None
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _check_personal_records(user_id: int, task_id: int, duration: Optional[int], estimated: Optional[int], db: Session):
    """Check and update personal records after task completion."""
    from app.models.models import PersonalRecord
    from datetime import datetime

    def _upsert_pr(record_type: str, value: float):
        existing = db.query(PersonalRecord).filter(
            PersonalRecord.user_id == user_id,
            PersonalRecord.task_id == task_id,
            PersonalRecord.record_type == record_type,
        ).first()
        if not existing:
            db.add(PersonalRecord(user_id=user_id, task_id=task_id, record_type=record_type, value=value))
            return True
        if value < existing.value if record_type == "fastest_completion" else value > existing.value:
            existing.value = value
            existing.achieved_at = datetime.utcnow()
            return True
        return False

    # Fastest completion
    if duration and duration > 0:
        _upsert_pr("fastest_completion", float(duration))

    # Most completions this week
    week_start = datetime.utcnow() - timedelta(days=7)
    week_count = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.task_id == task_id,
        TaskCompletion.completed_at >= week_start,
    ).count()
    _upsert_pr("most_completions_week", float(week_count))
