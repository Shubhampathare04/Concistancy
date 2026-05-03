"""
Analytics Engine
Aggregates event data from activity_logs + task_skips into weekly_analytics.
Called by Celery worker (weekly) and on-demand after skip detection.
"""
from datetime import date, datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import (
    TaskCompletion, TaskSkip, UserStats, WeeklyAnalytics, ActivityLog, Task
)


def get_week_start(d: date) -> date:
    """Returns the Monday of the week containing date d."""
    return d - timedelta(days=d.weekday())


def aggregate_user_week(user_id: int, week_start: date, db: Session) -> WeeklyAnalytics:
    """
    Computes weekly stats for a user for the given week.
    Upserts into weekly_analytics table.
    """
    week_end = week_start + timedelta(days=7)

    completions = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= datetime.combine(week_start, datetime.min.time()),
        TaskCompletion.completed_at < datetime.combine(week_end, datetime.min.time()),
    ).all()

    skips = db.query(TaskSkip).filter(
        TaskSkip.user_id == user_id,
        TaskSkip.skipped_date >= week_start,
        TaskSkip.skipped_date < week_end,
    ).count()

    total_events = len(completions) + skips
    completion_rate = len(completions) / total_events if total_events > 0 else 0.0

    # XP earned this week from activity_logs
    xp_logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.action_type == "TASK_COMPLETED",
        ActivityLog.created_at >= datetime.combine(week_start, datetime.min.time()),
        ActivityLog.created_at < datetime.combine(week_end, datetime.min.time()),
    ).all()
    xp_earned = sum(
        (log.meta or {}).get("xp_gained", 0) for log in xp_logs
    )

    # Average difficulty of completed tasks this week
    task_ids = [c.task_id for c in completions]
    avg_difficulty = 0.0
    if task_ids:
        result = db.query(func.avg(Task.difficulty)).filter(
            Task.id.in_(task_ids)
        ).scalar()
        avg_difficulty = round(float(result or 0.0), 2)

    # Consistency index snapshot
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    ci_snapshot = stats.consistency_index if stats else 0.0

    # Upsert
    existing = db.query(WeeklyAnalytics).filter(
        WeeklyAnalytics.user_id == user_id,
        WeeklyAnalytics.week_start == week_start,
    ).first()

    if existing:
        existing.completions = len(completions)
        existing.skips = skips
        existing.completion_rate = round(completion_rate, 3)
        existing.avg_difficulty = avg_difficulty
        existing.xp_earned = xp_earned
        existing.consistency_index_snapshot = ci_snapshot
        return existing
    else:
        record = WeeklyAnalytics(
            user_id=user_id,
            week_start=week_start,
            completions=len(completions),
            skips=skips,
            completion_rate=round(completion_rate, 3),
            avg_difficulty=avg_difficulty,
            xp_earned=xp_earned,
            consistency_index_snapshot=ci_snapshot,
        )
        db.add(record)
        return record


def get_weekly_trend(user_id: int, weeks: int, db: Session) -> List[Dict]:
    """
    Returns the last N weeks of analytics for a user.
    Used by Stats screen weekly heatmap.
    """
    records = db.query(WeeklyAnalytics).filter(
        WeeklyAnalytics.user_id == user_id,
    ).order_by(WeeklyAnalytics.week_start.desc()).limit(weeks).all()

    return [
        {
            "week_start":                str(r.week_start),
            "completions":               r.completions,
            "skips":                     r.skips,
            "completion_rate":           r.completion_rate,
            "avg_difficulty":            r.avg_difficulty,
            "xp_earned":                 r.xp_earned,
            "consistency_index_snapshot": r.consistency_index_snapshot,
        }
        for r in reversed(records)  # chronological order
    ]


def get_week_over_week_delta(user_id: int, db: Session) -> Optional[Dict]:
    """
    Compares this week vs last week.
    Returns delta values for consistency_index, completions, xp_earned.
    Used by AI insights engine to generate trend-based messages.
    """
    today = date.today()
    this_week = get_week_start(today)
    last_week = this_week - timedelta(weeks=1)

    this = db.query(WeeklyAnalytics).filter(
        WeeklyAnalytics.user_id == user_id,
        WeeklyAnalytics.week_start == this_week,
    ).first()

    prev = db.query(WeeklyAnalytics).filter(
        WeeklyAnalytics.user_id == user_id,
        WeeklyAnalytics.week_start == last_week,
    ).first()

    if not this or not prev:
        return None

    return {
        "completions_delta":       this.completions - prev.completions,
        "xp_delta":                this.xp_earned - prev.xp_earned,
        "consistency_index_delta": round(
            this.consistency_index_snapshot - prev.consistency_index_snapshot, 2
        ),
        "completion_rate_delta":   round(
            this.completion_rate - prev.completion_rate, 3
        ),
    }
