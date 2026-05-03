from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from app.db.session import get_db
from app.schemas.schemas import MoodLogCreate, MoodLogOut, MoodTrend
from app.models.models import MoodLog, TaskCompletion, User
from app.utils.deps import get_current_user

router = APIRouter()

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


@router.post("/", response_model=MoodLogOut)
def log_mood(data: MoodLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log = MoodLog(user_id=user.id, mood=data.mood, energy=data.energy, task_id=data.task_id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/recent", response_model=List[MoodLogOut])
def recent_moods(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(MoodLog).filter(
        MoodLog.user_id == user.id
    ).order_by(MoodLog.created_at.desc()).limit(20).all()


@router.get("/trend", response_model=MoodTrend)
def mood_trend(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=7)
    logs = db.query(MoodLog).filter(
        MoodLog.user_id == user.id,
        MoodLog.created_at >= since,
    ).all()

    if not logs:
        return MoodTrend(avg_mood=0, avg_energy=0, best_mood_day=None, mood_performance_insight=None)

    avg_mood   = round(sum(l.mood for l in logs) / len(logs), 1)
    avg_energy = round(sum(l.energy for l in logs) / len(logs), 1)

    # Best mood day
    day_mood: dict = {}
    for l in logs:
        dow = l.created_at.weekday()
        day_mood.setdefault(dow, []).append(l.mood)
    best_dow = max(day_mood, key=lambda d: sum(day_mood[d]) / len(day_mood[d]))
    best_day = DAYS[best_dow]

    # Correlate high energy with completions
    high_energy_days = {l.created_at.date() for l in logs if l.energy >= 4}
    completions_on_high = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id,
        TaskCompletion.completed_at >= since,
    ).all()
    high_completions = sum(1 for c in completions_on_high if c.completed_at.date() in high_energy_days)
    total_completions = len(completions_on_high)

    insight = None
    if total_completions > 0 and high_energy_days:
        pct = round(high_completions / total_completions * 100)
        insight = f"{pct}% of your completions happen on high-energy days. Prioritize hard tasks when energy is 4+."

    return MoodTrend(
        avg_mood=avg_mood,
        avg_energy=avg_energy,
        best_mood_day=best_day,
        mood_performance_insight=insight,
    )
