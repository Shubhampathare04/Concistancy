from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.db.session import get_db
from app.schemas.schemas import HabitCreate, HabitOut, HabitLogOut, HabitStreakOut
from app.models.models import Habit, HabitLog, HabitStreak, User
from app.utils.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[HabitOut])
def list_habits(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Habit).filter(Habit.user_id == user.id, Habit.is_active == True).all()


@router.post("/", response_model=HabitOut)
def create_habit(data: HabitCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = Habit(user_id=user.id, title=data.title, category=data.category, frequency=data.frequency)
    db.add(habit)
    db.commit()
    db.refresh(habit)
    db.add(HabitStreak(habit_id=habit.id, user_id=user.id))
    db.commit()
    return habit


@router.delete("/{habit_id}")
def delete_habit(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit.is_active = False
    db.commit()
    return {"status": "deleted"}


@router.post("/{habit_id}/log", response_model=HabitLogOut)
def log_habit(habit_id: int, note: str = "", user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    log = HabitLog(habit_id=habit_id, user_id=user.id, note=note or None)
    db.add(log)

    # Update habit streak
    hs = db.query(HabitStreak).filter(HabitStreak.habit_id == habit_id).first()
    if not hs:
        hs = HabitStreak(habit_id=habit_id, user_id=user.id)
        db.add(hs)
    today = date.today()
    if hs.last_logged_date is None:
        hs.current_streak = 1
    elif (today - hs.last_logged_date).days == 1:
        hs.current_streak += 1
    elif (today - hs.last_logged_date).days == 0:
        pass  # already logged today, no change
    else:
        hs.current_streak = 1
    hs.longest_streak = max(hs.longest_streak, hs.current_streak)
    hs.last_logged_date = today

    db.commit()
    db.refresh(log)
    return log


@router.get("/{habit_id}/logs", response_model=List[HabitLogOut])
def get_habit_logs(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return db.query(HabitLog).filter(HabitLog.habit_id == habit_id).order_by(HabitLog.logged_at.desc()).limit(30).all()


@router.get("/{habit_id}/streak", response_model=HabitStreakOut)
def get_habit_streak(habit_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    hs = db.query(HabitStreak).filter(HabitStreak.habit_id == habit_id, HabitStreak.user_id == user.id).first()
    if not hs:
        return HabitStreakOut(habit_id=habit_id, current_streak=0, longest_streak=0, last_logged_date=None)
    return HabitStreakOut(
        habit_id=hs.habit_id,
        current_streak=hs.current_streak,
        longest_streak=hs.longest_streak,
        last_logged_date=str(hs.last_logged_date) if hs.last_logged_date else None,
    )
