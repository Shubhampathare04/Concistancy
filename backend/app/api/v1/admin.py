from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.models import Event
import os

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change_this_admin_secret")

DEFAULT_EVENTS = [
    {"title": "7-Day Consistency Challenge", "description": "Complete at least one task every day for 7 days.", "type": "challenge", "reward_coins": 100, "days": 7},
    {"title": "30-Day Streak Master",        "description": "Maintain a 30-day streak to earn Diamond status.", "type": "challenge", "reward_coins": 500, "days": 30},
    {"title": "Fitness Week",                "description": "Complete 5 fitness tasks this week.",              "type": "event",     "reward_coins": 75,  "days": 7},
    {"title": "Mindfulness Month",           "description": "Log a meditation or yoga habit every day.",        "type": "challenge", "reward_coins": 200, "days": 30},
    {"title": "Early Bird Sprint",           "description": "Complete tasks before 9am for 5 consecutive days.","type": "challenge", "reward_coins": 150, "days": 5},
]


def _check_admin(x_admin_secret: str = Header(None)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/events")
def create_event(
    data: dict,
    db: Session = Depends(get_db),
    _: None = Depends(_check_admin),
):
    event = Event(
        title=data["title"],
        description=data.get("description"),
        type=data.get("type", "challenge"),
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=data.get("days", 7)),
        reward_coins=data.get("reward_coins", 50),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": event.id, "title": event.title}


@router.post("/events/seed")
def seed_events(db: Session = Depends(get_db), _: None = Depends(_check_admin)):
    created = 0
    for e in DEFAULT_EVENTS:
        existing = db.query(Event).filter(Event.title == e["title"]).first()
        if not existing:
            db.add(Event(
                title=e["title"],
                description=e["description"],
                type=e["type"],
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=e["days"]),
                reward_coins=e["reward_coins"],
            ))
            created += 1
    db.commit()
    return {"seeded": created}
