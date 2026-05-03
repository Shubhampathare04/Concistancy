from fastapi import APIRouter, Depends, Query, Header, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, date
from app.db.session import get_db
from app.schemas.schemas import (
    DashboardOut, ConsistencyReport, BehaviorScoreOut,
    WeeklyTrendOut, WeeklyAnalyticsOut, RankOut,
    PersonalRecordOut, ConsistencyHistoryOut, ConsistencySnapshotOut,
    XPMultiplierOut, RivalOut, SearchResults, TaskReminderCreate, TaskReminderOut,
)
from app.services import task_service
from app.services.ai_service import (
    compute_consistency_index, get_best_completion_hour,
    get_best_day_of_week, compute_task_behavior_score,
)
from app.services.analytics_service import get_weekly_trend, get_week_over_week_delta
from app.services.rank_service import get_rank
from app.models.models import (
    User, Streak, TaskCompletion, BehaviorScore,
    PersonalRecord, ConsistencySnapshot, XPMultiplierWindow,
    Rival, UserStats, Task, Habit, Event, Follow,
    TaskReminder,
)
from app.utils.deps import get_current_user
from app.core.config import settings

router = APIRouter()


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.get_dashboard(user.id, db)


@router.get("/consistency", response_model=ConsistencyReport)
def consistency_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    ci = compute_consistency_index(user.id, db)
    best_hour = get_best_completion_hour(user.id, db)
    best_day = get_best_day_of_week(user.id, db)
    completions_7d  = db.query(TaskCompletion).filter(TaskCompletion.user_id == user.id, TaskCompletion.completed_at >= now - timedelta(days=7)).count()
    completions_30d = db.query(TaskCompletion).filter(TaskCompletion.user_id == user.id, TaskCompletion.completed_at >= now - timedelta(days=30)).count()
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    current = streak.current_streak if streak else 0
    streak_health = "strong" if current >= 7 else "at_risk" if current > 0 else "broken"
    active_tasks = db.query(Task).filter(Task.user_id == user.id, Task.is_active == True, Task.deleted_at == None).count()
    expected_7d = active_tasks * 7
    weekly_rate = min(completions_7d / expected_7d, 1.0) if expected_7d > 0 else 0.0
    return ConsistencyReport(
        user_id=user.id, consistency_index=ci,
        weekly_completion_rate=round(weekly_rate, 3),
        best_day_of_week=best_day, best_hour_of_day=best_hour,
        total_completions_7d=completions_7d, total_completions_30d=completions_30d,
        streak_health=streak_health,
    )


@router.get("/behavior-scores", response_model=List[BehaviorScoreOut])
def behavior_scores(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scores = db.query(BehaviorScore).filter(BehaviorScore.user_id == user.id).all()
    return [BehaviorScoreOut.model_validate(s) for s in scores]


@router.get("/rank", response_model=RankOut)
def rank(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_rank(user.id, db)


@router.get("/weekly-trend", response_model=WeeklyTrendOut)
def weekly_trend(
    weeks: int = Query(8, ge=1, le=52),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trend_data = get_weekly_trend(user.id, weeks, db)
    delta = get_week_over_week_delta(user.id, db)
    return WeeklyTrendOut(
        weeks=[WeeklyAnalyticsOut(**w) for w in trend_data],
        week_over_week=delta,
    )


@router.get("/personal-records", response_model=List[PersonalRecordOut])
def personal_records(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PersonalRecord).filter(PersonalRecord.user_id == user.id).order_by(PersonalRecord.achieved_at.desc()).all()


@router.get("/consistency-history", response_model=ConsistencyHistoryOut)
def consistency_history(
    days: int = Query(30, ge=7, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    snaps = db.query(ConsistencySnapshot).filter(
        ConsistencySnapshot.user_id == user.id,
        ConsistencySnapshot.snapped_at >= since,
    ).order_by(ConsistencySnapshot.snapped_at.asc()).all()

    snapshots = [ConsistencySnapshotOut(score=s.score, snapped_at=str(s.snapped_at)) for s in snaps]

    # Trend calculation
    trend = "stable"
    delta_7d = 0.0
    if len(snaps) >= 2:
        recent = [s.score for s in snaps[-7:]]
        older  = [s.score for s in snaps[:-7]] if len(snaps) > 7 else [snaps[0].score]
        delta_7d = round(sum(recent) / len(recent) - sum(older) / len(older), 2)
        trend = "up" if delta_7d > 2 else "down" if delta_7d < -2 else "stable"

    return ConsistencyHistoryOut(snapshots=snapshots, trend=trend, delta_7d=delta_7d)


@router.get("/xp-multiplier", response_model=XPMultiplierOut)
def xp_multiplier(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    window = db.query(XPMultiplierWindow).filter(
        XPMultiplierWindow.user_id == user.id,
        XPMultiplierWindow.starts_at <= now,
        XPMultiplierWindow.ends_at > now,
    ).first()
    if not window:
        return XPMultiplierOut(active=False, multiplier=1.0, ends_at=None, minutes_remaining=None)
    mins = int((window.ends_at - now).total_seconds() / 60)
    return XPMultiplierOut(active=True, multiplier=window.multiplier, ends_at=window.ends_at, minutes_remaining=mins)


@router.get("/rival", response_model=RivalOut)
def get_rival(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rival_row = db.query(Rival).filter(Rival.challenger_id == user.id).first()
    if not rival_row:
        raise HTTPException(status_code=404, detail="No rival set")
    rival_user  = db.query(User).filter(User.id == rival_row.rival_id).first()
    rival_stats = db.query(Streak).filter(Streak.user_id == rival_row.rival_id).first()
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    rival_today = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == rival_row.rival_id,
        TaskCompletion.completed_at >= today_start,
    ).count()
    my_today = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id,
        TaskCompletion.completed_at >= today_start,
    ).count()
    return RivalOut(
        rival_id=rival_row.rival_id,
        rival_name=rival_user.name or "Rival" if rival_user else "Rival",
        rival_streak=rival_stats.current_streak if rival_stats else 0,
        rival_today_completions=rival_today,
        my_today_completions=my_today,
        leading=my_today >= rival_today,
    )


@router.post("/rival/{target_id}")
def set_rival(target_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if target_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot rival yourself")
    db.query(Rival).filter(Rival.challenger_id == user.id).delete()
    db.add(Rival(challenger_id=user.id, rival_id=target_id))
    db.commit()
    return {"status": "rival_set"}


@router.delete("/rival")
def remove_rival(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Rival).filter(Rival.challenger_id == user.id).delete()
    db.commit()
    return {"status": "removed"}


@router.get("/search", response_model=SearchResults)
def search(
    q: str = Query(..., min_length=2),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.schemas.schemas import TaskOut, HabitOut, EventOut, PublicProfile
    from app.models.models import Follow

    tasks = db.query(Task).filter(
        Task.user_id == user.id,
        Task.title.ilike(f"%{q}%"),
        Task.is_active == True,
        Task.deleted_at == None,
    ).limit(10).all()

    habits = db.query(Habit).filter(
        Habit.user_id == user.id,
        Habit.title.ilike(f"%{q}%"),
        Habit.is_active == True,
    ).limit(10).all()

    events = db.query(Event).filter(
        Event.title.ilike(f"%{q}%"),
        Event.is_active == True,
    ).limit(10).all()

    users = db.query(User).options(
        joinedload(User.stats),
        joinedload(User.streak)
    ).filter(
        User.name.ilike(f"%{q}%"),
        User.is_active == True,
        User.id != user.id,
    ).limit(10).all()

    def to_public(u: User) -> PublicProfile:
        is_following = db.query(Follow).filter(Follow.follower_id == user.id, Follow.following_id == u.id).first() is not None
        return PublicProfile(
            id=u.id, name=u.name,
            level=u.stats.level if u.stats else 1,
            streak=u.streak.current_streak if u.streak else 0,
            xp=u.stats.xp if u.stats else 0,
            coins=u.stats.coins if u.stats else 0,
            consistency_index=u.stats.consistency_index if u.stats else 0.0,
            is_following=is_following,
        )

    event_outs = []
    for e in events:
        count = db.query(Event).filter(Event.id == e.id).count()
        from app.schemas.schemas import EventOut as EO
        out = EO.model_validate(e)
        out.participant_count = 0
        out.user_joined = False
        event_outs.append(out)

    return SearchResults(
        tasks=[TaskOut.model_validate(t) for t in tasks],
        habits=[HabitOut.model_validate(h) for h in habits],
        events=event_outs,
        users=[to_public(u) for u in users],
    )


# ─── Task Reminders ──────────────────────────────────────────────────────────

@router.post("/tasks/{task_id}/reminder", response_model=TaskReminderOut)
def set_reminder(
    task_id: int,
    data: TaskReminderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import time as dtime
    h, m = map(int, data.remind_at.split(":"))
    existing = db.query(TaskReminder).filter(
        TaskReminder.task_id == task_id, TaskReminder.user_id == user.id
    ).first()
    if existing:
        existing.remind_at = dtime(h, m)
        existing.days_of_week = data.days_of_week
        existing.is_active = True
    else:
        existing = TaskReminder(
            task_id=task_id, user_id=user.id,
            remind_at=dtime(h, m), days_of_week=data.days_of_week,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


@router.delete("/tasks/{task_id}/reminder")
def delete_reminder(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(TaskReminder).filter(
        TaskReminder.task_id == task_id, TaskReminder.user_id == user.id
    ).delete()
    db.commit()
    return {"status": "deleted"}
