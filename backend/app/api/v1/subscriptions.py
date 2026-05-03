from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.schemas.schemas import SubscriptionOut, SubscribeRequest
from app.models.models import Subscription, User, UserStats, Streak
from app.utils.deps import get_current_user

router = APIRouter()

PLAN_DURATION = {"pro": 30, "elite": 30}  # days
PLAN_COIN_COST = {"pro": 200, "elite": 500}
STREAK_DISCOUNT_THRESHOLD = 7  # streak >= 7 → 20% coin discount


@router.get("/status", response_model=SubscriptionOut)
def subscription_status(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        # Auto-create free tier
        sub = Subscription(user_id=user.id, plan="free", status="active")
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


@router.post("/subscribe", response_model=SubscriptionOut)
def subscribe(
    data: SubscribeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.plan not in ("pro", "elite"):
        raise HTTPException(status_code=400, detail="Invalid plan")

    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    cur_streak = streak.current_streak if streak else 0

    cost = PLAN_COIN_COST[data.plan]
    if cur_streak >= STREAK_DISCOUNT_THRESHOLD:
        cost = int(cost * 0.8)  # 20% streak discount

    if not stats or (stats.coins or 0) < cost:
        raise HTTPException(status_code=402, detail=f"Insufficient coins. Need {cost} coins.")

    stats.coins -= cost

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id)
        db.add(sub)

    sub.plan = data.plan
    sub.status = "active"
    sub.expires_at = datetime.utcnow() + timedelta(days=PLAN_DURATION[data.plan])
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/renew", response_model=SubscriptionOut)
def renew(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub or sub.plan == "free":
        raise HTTPException(status_code=400, detail="No active paid subscription to renew")

    stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    cur_streak = streak.current_streak if streak else 0

    cost = PLAN_COIN_COST[sub.plan]
    if cur_streak >= STREAK_DISCOUNT_THRESHOLD:
        cost = int(cost * 0.8)

    if not stats or (stats.coins or 0) < cost:
        raise HTTPException(status_code=402, detail=f"Insufficient coins. Need {cost} coins.")

    stats.coins -= cost
    sub.status = "active"
    sub.expires_at = (sub.expires_at or datetime.utcnow()) + timedelta(days=PLAN_DURATION[sub.plan])
    db.commit()
    db.refresh(sub)
    return sub


@router.post("/freeze-streak")
def freeze_streak(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub or sub.plan == "free":
        raise HTTPException(status_code=403, detail="Streak freeze requires Pro or Elite plan")
    if sub.streak_freeze_count <= 0:
        raise HTTPException(status_code=400, detail="No streak freezes remaining")

    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    if streak:
        from datetime import date
        streak.last_completed_date = date.today()  # prevent streak reset tonight

    sub.streak_freeze_count -= 1
    db.commit()
    return {"status": "frozen", "freezes_remaining": sub.streak_freeze_count}
