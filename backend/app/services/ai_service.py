"""
AI Engine v2 — Behavior Scoring System
Replaces simple rule engine with:
- Consistency Index (0-100)
- Adaptive difficulty model
- Task success probability predictor
- Smart scheduling engine
- Behavior pattern analysis
"""
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models.models import TaskCompletion, Task, ActivityLog, BehaviorScore, UserStats, WeeklyAnalytics


# ─── Consistency Index ────────────────────────────────────────────────────────

def compute_consistency_index(user_id: int, db: Session) -> float:
    """
    Consistency Index (0-100) — weighted score across multiple signals:
    - 7-day completion rate (40%)
    - 30-day completion rate (30%)
    - Streak health (20%)
    - Recency bonus (10%)
    """
    now = datetime.utcnow()
    day7 = now - timedelta(days=7)
    day30 = now - timedelta(days=30)

    active_tasks = db.query(Task).filter(
        Task.user_id == user_id, Task.is_active == True, Task.deleted_at == None
    ).count()

    if active_tasks == 0:
        return 0.0

    completions_7d = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= day7
    ).count()

    completions_30d = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= day30
    ).count()

    expected_7d = active_tasks * 7
    expected_30d = active_tasks * 30

    rate_7d = min(completions_7d / expected_7d, 1.0) if expected_7d > 0 else 0.0
    rate_30d = min(completions_30d / expected_30d, 1.0) if expected_30d > 0 else 0.0

    # Recency: did user complete anything in last 24h?
    recency = 1.0 if db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= now - timedelta(hours=24)
    ).count() > 0 else 0.0

    # Streak health from user_stats
    stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    streak = stats.total_completions if stats else 0
    streak_score = min(streak / 30.0, 1.0)

    index = (rate_7d * 40) + (rate_30d * 30) + (streak_score * 20) + (recency * 10)
    return round(index, 2)


# ─── Behavior Score per Task ──────────────────────────────────────────────────

def compute_task_behavior_score(user_id: int, task_id: int, db: Session) -> Dict:
    """
    Computes per-task behavior metrics:
    - success_rate: completions / expected completions
    - avg_completion_hour: when user typically completes this task
    - avg_duration_minutes: how long it takes
    - predicted_success_prob: logistic-style probability
    - recommended_difficulty: adaptive suggestion
    """
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        return {}

    completions = db.query(TaskCompletion).filter(
        TaskCompletion.task_id == task_id,
        TaskCompletion.user_id == user_id
    ).all()

    total = len(completions)
    if total == 0:
        return {
            "success_rate": 0.0,
            "avg_completion_hour": None,
            "avg_duration_minutes": None,
            "predicted_success_prob": 0.5,
            "recommended_difficulty": task.difficulty,
        }

    # Days since task was created
    days_active = max((datetime.utcnow() - task.created_at).days, 1)
    expected = days_active if task.schedule_type == "daily" else days_active // 7
    success_rate = min(total / max(expected, 1), 1.0)

    # Average completion hour
    hours = [c.completed_at.hour for c in completions if c.completed_at]
    avg_hour = round(sum(hours) / len(hours), 1) if hours else None

    # Average duration
    durations = [c.duration_minutes for c in completions if c.duration_minutes]
    avg_duration = round(sum(durations) / len(durations), 1) if durations else None

    # Success probability — logistic-style based on recent trend
    recent_30d = [
        c for c in completions
        if c.completed_at and c.completed_at >= datetime.utcnow() - timedelta(days=30)
    ]
    recent_rate = len(recent_30d) / max(min(days_active, 30), 1)
    predicted_prob = round(min(max(recent_rate, 0.05), 0.95), 3)

    # Adaptive difficulty
    recommended = _adaptive_difficulty(
        current=task.difficulty,
        success_rate=success_rate,
        avg_duration=avg_duration,
        expected_duration=task.estimated_minutes,
    )

    return {
        "success_rate": round(success_rate, 3),
        "avg_completion_hour": avg_hour,
        "avg_duration_minutes": avg_duration,
        "predicted_success_prob": predicted_prob,
        "recommended_difficulty": recommended,
    }


def _adaptive_difficulty(
    current: int,
    success_rate: float,
    avg_duration: Optional[float],
    expected_duration: Optional[int],
) -> int:
    """
    Adaptive difficulty model:
    - High success + fast completion → increase difficulty
    - Low success → decrease difficulty
    - Time-based adjustment as secondary signal
    """
    delta = 0

    if success_rate > 0.85:
        delta += 1
    elif success_rate < 0.35:
        delta -= 1

    if avg_duration and expected_duration:
        ratio = avg_duration / expected_duration
        if ratio < 0.7:
            delta += 1   # completing much faster → too easy
        elif ratio > 1.5:
            delta -= 1   # taking much longer → too hard

    return max(1, min(5, current + delta))


# ─── Smart Scheduling ─────────────────────────────────────────────────────────

def get_best_completion_hour(user_id: int, db: Session) -> Optional[int]:
    """Returns the hour of day when user most consistently completes tasks."""
    result = db.query(
        extract("hour", TaskCompletion.completed_at).label("hour"),
        func.count().label("cnt")
    ).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= datetime.utcnow() - timedelta(days=30)
    ).group_by("hour").order_by(func.count().desc()).first()

    return int(result.hour) if result else None


def get_best_day_of_week(user_id: int, db: Session) -> Optional[str]:
    """Returns the day of week with highest completion rate."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    result = db.query(
        extract("weekday", TaskCompletion.completed_at).label("dow"),
        func.count().label("cnt")
    ).filter(
        TaskCompletion.user_id == user_id,
        TaskCompletion.completed_at >= datetime.utcnow() - timedelta(days=30)
    ).group_by("dow").order_by(func.count().desc()).first()

    if result:
        return days[int(result.dow)]
    return None


# ─── AI Insights Engine ───────────────────────────────────────────────────────

def generate_insights(
    user_id: int,
    consistency_index: float,
    streak: int,
    fail_rate: float,
    best_hour: Optional[int],
    best_day: Optional[str],
    db: Session,
) -> List[Dict]:
    """
    Generates prioritized AI insights.
    Returns list of {type, message, priority} dicts.
    """
    insights = []

    # Streak at risk
    last_completion = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id
    ).order_by(TaskCompletion.completed_at.desc()).first()

    if last_completion:
        hours_since = (datetime.utcnow() - last_completion.completed_at).total_seconds() / 3600
        if hours_since > 20 and streak > 0:
            insights.append({
                "type": "warning",
                "message": f"Your {streak}-day streak is at risk — complete a task today!",
                "priority": 1,
            })

    # Consistency feedback
    if consistency_index >= 80:
        insights.append({
            "type": "achievement",
            "message": f"Outstanding! Your consistency index is {consistency_index:.0f}/100",
            "priority": 3,
        })
    elif consistency_index < 30:
        insights.append({
            "type": "suggestion",
            "message": "Your consistency is low. Try completing just one task today to rebuild momentum.",
            "priority": 1,
        })

    # Difficulty suggestion
    if fail_rate > 0.5:
        insights.append({
            "type": "suggestion",
            "message": "You're struggling with current tasks. Consider reducing difficulty to build momentum.",
            "priority": 2,
        })

    # Scheduling suggestion
    if best_hour is not None:
        period = "morning" if best_hour < 12 else "afternoon" if best_hour < 17 else "evening"
        insights.append({
            "type": "suggestion",
            "message": f"You perform best in the {period} (~{best_hour}:00). Schedule your hardest tasks then.",
            "priority": 2,
        })

    if best_day:
        insights.append({
            "type": "suggestion",
            "message": f"{best_day} is your strongest day. Plan your most important tasks for then.",
            "priority": 3,
        })

    # Week-over-week trend insight
    _add_trend_insight(user_id, insights, db)

    return sorted(insights, key=lambda x: x["priority"])


def _add_trend_insight(user_id: int, insights: List[Dict], db: Session) -> None:
    """Adds a week-over-week trend insight if data is available."""
    from datetime import date as date_type
    from app.services.analytics_service import get_week_over_week_delta
    delta = get_week_over_week_delta(user_id, db)
    if not delta:
        return
    ci_delta = delta.get("consistency_index_delta", 0)
    comp_delta = delta.get("completions_delta", 0)
    if ci_delta >= 10:
        insights.append({
            "type": "achievement",
            "message": f"Your consistency score improved by {ci_delta:.0f} points this week. Great momentum!",
            "priority": 2,
        })
    elif ci_delta <= -10:
        insights.append({
            "type": "warning",
            "message": f"Your consistency dropped {abs(ci_delta):.0f} points vs last week. Time to refocus.",
            "priority": 1,
        })
    elif comp_delta > 0:
        insights.append({
            "type": "suggestion",
            "message": f"You completed {comp_delta} more tasks than last week. Keep the momentum going.",
            "priority": 3,
        })


# ─── XP Engine ───────────────────────────────────────────────────────────────

def calculate_xp(
    difficulty: int,
    streak: int,
    consistency_index: float,
    duration_minutes: Optional[int] = None,
    estimated_minutes: Optional[int] = None,
) -> int:
    """
    XP formula:
    base = difficulty * 10
    streak_bonus = min(streak * 2, 50)
    consistency_bonus = consistency_index * 0.5
    speed_bonus = 10 if completed faster than estimated
    """
    base = difficulty * 10
    streak_bonus = min(streak * 2, 50)
    consistency_bonus = int(consistency_index * 0.5)

    speed_bonus = 0
    if duration_minutes and estimated_minutes and duration_minutes < estimated_minutes:
        speed_bonus = 10

    return base + streak_bonus + consistency_bonus + speed_bonus


# ─── Streak Logic ─────────────────────────────────────────────────────────────

def update_streak(last_date: Optional[date], today: date) -> str:
    if last_date is None:
        return "increment"
    delta = (today - last_date).days
    if delta == 1:
        return "increment"
    elif delta == 0:
        return "no_change"
    return "reset"


# ─── Backward compat ─────────────────────────────────────────────────────────

def get_suggestions(fail_rate: float, best_hour: Optional[int]) -> List[str]:
    suggestions = []
    if fail_rate > 0.5:
        suggestions.append("Consider reducing task difficulty")
    if best_hour is not None:
        suggestions.append(f"You perform best around {best_hour}:00 — schedule tasks then")
    return suggestions


# ─── Sensor/Target detection helpers (used by onboarding) ────────────────────

def _detect_sensor_type_from_title(title: str) -> str:
    t = title.lower()
    if any(k in t for k in ["step", "walk", "run", "jog", "hike"]): return "steps"
    if any(k in t for k in ["water", "glass", "drink", "hydrat"]):   return "water"
    if any(k in t for k in ["pushup", "squat", "rep", "curl", "lunge", "burpee"]): return "reps"
    if any(k in t for k in ["minute", "min", "meditat", "read", "study", "focus", "yoga", "plank"]): return "timer"
    return "none"


def _detect_target_from_title(title: str) -> Optional[int]:
    import re
    m = re.search(r"(\d[\d,]*)\s*(step|walk|glass|min|rep|pushup|squat|ml|litre|liter|km)", title, re.I)
    if m:
        try:
            return int(m.group(1).replace(",", ""))
        except Exception:
            pass
    return None
