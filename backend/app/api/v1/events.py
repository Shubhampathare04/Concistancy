from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.schemas.schemas import EventOut, LeaderboardEntry
from app.models.models import Event, EventParticipant, User, UserStats, Streak
from app.utils.deps import get_current_user

router = APIRouter()


def _enrich(event: Event, user_id: int, db: Session) -> EventOut:
    count = db.query(EventParticipant).filter(EventParticipant.event_id == event.id).count()
    joined = db.query(EventParticipant).filter(
        EventParticipant.event_id == event.id,
        EventParticipant.user_id == user_id,
    ).first() is not None
    out = EventOut.model_validate(event)
    out.participant_count = count
    out.user_joined = joined
    return out


@router.get("/", response_model=List[EventOut])
def list_events(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.is_active == True).order_by(Event.start_date.desc()).all()
    return [_enrich(e, user.id, db) for e in events]


@router.post("/{event_id}/join")
def join_event(event_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id, Event.is_active == True).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.user_id == user.id,
    ).first()
    if existing:
        return {"status": "already_joined"}
    db.add(EventParticipant(event_id=event_id, user_id=user.id))
    db.commit()
    return {"status": "joined"}


@router.post("/{event_id}/complete")
def complete_event(event_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    participant = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.user_id == user.id,
    ).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Not joined")
    if participant.completed_at:
        return {"status": "already_completed"}
    participant.completed_at = datetime.utcnow()
    # Award coins
    event = db.query(Event).filter(Event.id == event_id).first()
    if event and event.reward_coins > 0:
        from app.models.models import UserStats
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        if stats:
            stats.coins = (stats.coins or 0) + event.reward_coins
    db.commit()
    return {"status": "completed", "coins_awarded": event.reward_coins if event else 0}


@router.get("/{event_id}/leaderboard", response_model=List[LeaderboardEntry])
def event_leaderboard(event_id: int, db: Session = Depends(get_db)):
    participants = db.query(EventParticipant).filter(
        EventParticipant.event_id == event_id,
        EventParticipant.completed_at != None,
    ).order_by(EventParticipant.completed_at.asc()).limit(50).all()

    result = []
    for i, p in enumerate(participants):
        user = db.query(User).filter(User.id == p.user_id).first()
        stats = db.query(UserStats).filter(UserStats.user_id == p.user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == p.user_id).first()
        result.append(LeaderboardEntry(
            user_id=p.user_id,
            name=user.name or "User" if user else "User",
            xp=stats.xp if stats else 0,
            streak=streak.current_streak if streak else 0,
            coins=stats.coins if stats else 0,
            level=stats.level if stats else 1,
            rank=i + 1,
        ))
    return result
