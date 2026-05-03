from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
from app.db.session import get_db
from app.schemas.schemas import AISuggestRequest, AISuggestResponse, WeeklyReportOut
from app.models.models import User, UserStats, Streak, WeeklyAnalytics, ActivityLog, TaskCompletion
from app.utils.deps import get_current_user
from app.services.ai_service import get_best_completion_hour
from app.services.analytics_service import get_week_start

router = APIRouter()

# ─── Keyword detection (mirrors mobile detectSensorType) ─────────────────────
_STEP_KW  = ["step", "walk", "run", "jog", "hike"]
_TIMER_KW = ["minute", "min", "hour", "meditat", "read", "study", "focus", "work", "practice", "stretch", "yoga", "plank"]
_REPS_KW  = ["pushup", "push-up", "pullup", "pull-up", "squat", "situp", "sit-up", "rep", "curl", "press", "lunge", "burpee", "crunch"]
_WATER_KW = ["water", "glass", "drink", "hydrat", "litre", "liter"]

# ─── 50+ Task Templates ───────────────────────────────────────────────────────
TASK_TEMPLATES = {
    "fitness": [
        {"title": "10,000 steps daily",     "difficulty": 3, "sensor": "steps",  "target": 10000, "minutes": 90},
        {"title": "5km run",                "difficulty": 3, "sensor": "steps",  "target": 5000,  "minutes": 30},
        {"title": "100 pushups",            "difficulty": 4, "sensor": "reps",   "target": 100,   "minutes": 20},
        {"title": "50 squats",              "difficulty": 2, "sensor": "reps",   "target": 50,    "minutes": 10},
        {"title": "30 min workout",         "difficulty": 3, "sensor": "timer",  "target": 30,    "minutes": 30},
        {"title": "20 min yoga",            "difficulty": 2, "sensor": "timer",  "target": 20,    "minutes": 20},
        {"title": "10 min plank",           "difficulty": 3, "sensor": "timer",  "target": 10,    "minutes": 10},
        {"title": "50 burpees",             "difficulty": 4, "sensor": "reps",   "target": 50,    "minutes": 15},
        {"title": "100 sit-ups",            "difficulty": 3, "sensor": "reps",   "target": 100,   "minutes": 15},
        {"title": "15,000 steps challenge", "difficulty": 4, "sensor": "steps",  "target": 15000, "minutes": 120},
    ],
    "mindfulness": [
        {"title": "30 min meditation",      "difficulty": 2, "sensor": "timer",  "target": 30,    "minutes": 30},
        {"title": "10 min breathing",       "difficulty": 1, "sensor": "timer",  "target": 10,    "minutes": 10},
        {"title": "Gratitude journaling",   "difficulty": 1, "sensor": "none",   "target": None,  "minutes": 10},
        {"title": "5 min mindful walk",     "difficulty": 1, "sensor": "timer",  "target": 5,     "minutes": 5},
        {"title": "20 min yoga flow",       "difficulty": 2, "sensor": "timer",  "target": 20,    "minutes": 20},
        {"title": "Digital detox 1 hour",   "difficulty": 3, "sensor": "timer",  "target": 60,    "minutes": 60},
        {"title": "Evening reflection",     "difficulty": 1, "sensor": "none",   "target": None,  "minutes": 10},
        {"title": "Cold shower",            "difficulty": 3, "sensor": "none",   "target": None,  "minutes": 5},
    ],
    "learning": [
        {"title": "45 min study session",   "difficulty": 3, "sensor": "timer",  "target": 45,    "minutes": 45},
        {"title": "Read for 30 minutes",    "difficulty": 2, "sensor": "timer",  "target": 30,    "minutes": 30},
        {"title": "1 hour deep work",       "difficulty": 4, "sensor": "timer",  "target": 60,    "minutes": 60},
        {"title": "Learn 10 new words",     "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 15},
        {"title": "Watch 1 lecture",        "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 45},
        {"title": "Practice coding 1 hour", "difficulty": 3, "sensor": "timer",  "target": 60,    "minutes": 60},
        {"title": "Write 500 words",        "difficulty": 3, "sensor": "none",   "target": None,  "minutes": 30},
        {"title": "Review flashcards",      "difficulty": 1, "sensor": "none",   "target": None,  "minutes": 15},
    ],
    "diet": [
        {"title": "8 glasses of water",     "difficulty": 2, "sensor": "water",  "target": 8,     "minutes": None},
        {"title": "No sugar today",         "difficulty": 3, "sensor": "none",   "target": None,  "minutes": None},
        {"title": "Eat 5 servings of veg",  "difficulty": 2, "sensor": "none",   "target": None,  "minutes": None},
        {"title": "Intermittent fast 16h",  "difficulty": 4, "sensor": "none",   "target": None,  "minutes": None},
        {"title": "Drink 3L water",         "difficulty": 3, "sensor": "water",  "target": 10,    "minutes": None},
        {"title": "No processed food",      "difficulty": 3, "sensor": "none",   "target": None,  "minutes": None},
        {"title": "Meal prep Sunday",       "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 60},
    ],
    "productivity": [
        {"title": "Morning routine",        "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 30},
        {"title": "Inbox zero",             "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 20},
        {"title": "Plan tomorrow tonight",  "difficulty": 1, "sensor": "none",   "target": None,  "minutes": 10},
        {"title": "2 hour focus block",     "difficulty": 4, "sensor": "timer",  "target": 120,   "minutes": 120},
        {"title": "No phone before 9am",    "difficulty": 3, "sensor": "none",   "target": None,  "minutes": None},
        {"title": "Weekly review",          "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 30},
        {"title": "Clear desk before bed",  "difficulty": 1, "sensor": "none",   "target": None,  "minutes": 5},
        {"title": "3 most important tasks", "difficulty": 2, "sensor": "none",   "target": None,  "minutes": 60},
    ],
}


def _detect_sensor(text: str) -> str:
    t = text.lower()
    if any(k in t for k in _STEP_KW):  return "steps"
    if any(k in t for k in _WATER_KW): return "water"
    if any(k in t for k in _REPS_KW):  return "reps"
    if any(k in t for k in _TIMER_KW): return "timer"
    return "none"


def _detect_target(text: str) -> Optional[int]:
    import re
    m = re.search(r"(\d[\d,]*)\s*(step|walk|glass|min|rep|pushup|squat|ml|litre|liter|km)", text, re.I)
    if m:
        try:
            return int(m.group(1).replace(",", ""))
        except Exception:
            pass
    return None


def _suggest_difficulty(sensor: str, target: Optional[int]) -> int:
    if sensor == "steps":
        if target and target >= 15000: return 4
        if target and target >= 10000: return 3
        return 2
    if sensor == "reps":
        if target and target >= 100: return 4
        if target and target >= 50:  return 3
        return 2
    if sensor == "timer":
        if target and target >= 60: return 4
        if target and target >= 30: return 3
        return 2
    return 3


@router.post("/suggest", response_model=AISuggestResponse)
def suggest_tasks(data: AISuggestRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = f"{data.title} {data.description or ''}".lower()
    sensor = _detect_sensor(text)
    target = _detect_target(text)
    difficulty = _suggest_difficulty(sensor, target)

    all_templates = [t["title"] for cat in TASK_TEMPLATES.values() for t in cat]
    words = set(text.split())
    scored = sorted([(sum(1 for w in t.lower().split() if w in words), t) for t in all_templates], reverse=True)
    suggestions = [t for _, t in scored[:5] if t.lower() != data.title.lower()]
    if not suggestions:
        suggestions = all_templates[:5]

    return AISuggestResponse(
        suggestions=suggestions,
        detected_sensor=sensor,
        detected_target=target,
        predicted_difficulty=difficulty,
    )


@router.get("/templates")
def get_templates(category: Optional[str] = Query(None)):
    if category and category in TASK_TEMPLATES:
        return {"category": category, "templates": TASK_TEMPLATES[category]}
    return {"categories": list(TASK_TEMPLATES.keys()), "templates": TASK_TEMPLATES}


@router.get("/weekly-report", response_model=WeeklyReportOut)
def weekly_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    last_week = get_week_start(today) - timedelta(weeks=1)
    record = db.query(WeeklyAnalytics).filter(
        WeeklyAnalytics.user_id == user.id,
        WeeklyAnalytics.week_start == last_week,
    ).first()
    stats     = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    streak_row = db.query(Streak).filter(Streak.user_id == user.id).first()

    completions = record.completions if record else 0
    xp_earned   = record.xp_earned if record else 0
    ci          = record.consistency_index_snapshot if record else (stats.consistency_index if stats else 0.0)
    streak      = streak_row.current_streak if streak_row else 0

    top_insight = None
    if record:
        if record.completion_rate >= 0.8:
            top_insight = f"Excellent week! {completions} tasks at {record.completion_rate*100:.0f}% rate."
        elif record.skips > record.completions:
            top_insight = f"Tough week — {record.skips} skips. Focus on one task per day next week."

    best_hour = get_best_completion_hour(user.id, db)
    period = "morning" if (best_hour or 9) < 12 else "afternoon" if (best_hour or 14) < 17 else "evening"
    tip = f"Your best performance window is the {period}. Schedule tasks around {best_hour or 9}:00."

    return WeeklyReportOut(
        week_start=str(last_week),
        completions=completions,
        xp_earned=xp_earned,
        consistency_index=ci,
        streak=streak,
        top_insight=top_insight,
        improvement_tip=tip,
    )


@router.post("/focus-start/{task_id}")
def focus_start(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(ActivityLog(
        user_id=user.id,
        action_type="FOCUS_SESSION_START",
        meta={"task_id": task_id, "started_at": datetime.utcnow().isoformat()},
    ))
    db.commit()
    return {"status": "focus_started", "task_id": task_id, "started_at": datetime.utcnow().isoformat()}


@router.post("/focus-end/{task_id}")
def focus_end(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find the start log
    start_log = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id,
        ActivityLog.action_type == "FOCUS_SESSION_START",
    ).order_by(ActivityLog.created_at.desc()).first()

    duration_minutes = 0
    if start_log and start_log.meta:
        try:
            started = datetime.fromisoformat(start_log.meta["started_at"])
            duration_minutes = int((datetime.utcnow() - started).total_seconds() / 60)
        except Exception:
            pass

    # Bonus XP for focus session (5 XP per 10 minutes, capped at 50)
    bonus_xp = min((duration_minutes // 10) * 5, 50)
    if bonus_xp > 0:
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        if stats:
            stats.xp += bonus_xp

    db.add(ActivityLog(
        user_id=user.id,
        action_type="FOCUS_SESSION_END",
        meta={"task_id": task_id, "duration_minutes": duration_minutes, "bonus_xp": bonus_xp},
    ))
    db.commit()
    return {"status": "focus_ended", "duration_minutes": duration_minutes, "bonus_xp": bonus_xp}
