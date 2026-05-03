from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.schemas.schemas import (
    UserCreate, UserLogin, Token, RefreshRequest, TokenRefreshOut,
    FCMTokenRegister, UserProfile, OnboardRequest, StreakRecoveryStatus,
)
from app.services import auth_service
from app.utils.deps import get_current_user
from app.models.models import User, FCMToken, Streak, TaskCompletion

router = APIRouter()


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return auth_service.register(data, db)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    return auth_service.login(data, db)


@router.post("/refresh", response_model=TokenRefreshOut)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(data.refresh_token, db)


@router.post("/logout")
def logout(data: RefreshRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    auth_service.logout(user.id, data.refresh_token, db)
    return {"status": "logged_out"}


@router.get("/me", response_model=UserProfile)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/fcm-token")
def register_fcm_token(
    data: FCMTokenRegister,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(FCMToken).filter(FCMToken.user_id == user.id).update({"is_active": False})
    existing = db.query(FCMToken).filter(FCMToken.token == data.token).first()
    if existing:
        existing.user_id = user.id
        existing.is_active = True
        existing.platform = data.platform
    else:
        db.add(FCMToken(user_id=user.id, token=data.token, platform=data.platform))
    db.commit()
    return {"status": "registered"}


@router.post("/onboard")
def onboard(
    data: OnboardRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.models import Task
    from app.services.ai_service import _detect_sensor_type_from_title, _detect_target_from_title
    # Save goal
    user.goal = data.goal
    user.is_onboarded = True
    # Create starter tasks
    for title in data.starter_task_titles[:5]:
        sensor = _detect_sensor_type_from_title(title)
        target = _detect_target_from_title(title)
        db.add(Task(
            user_id=user.id,
            title=title,
            difficulty=2,
            schedule_type="daily",
            sensor_type=sensor if sensor != "none" else None,
            target=target,
        ))
    db.commit()
    return {"status": "onboarded", "goal": data.goal}


@router.get("/streak-recovery", response_model=StreakRecoveryStatus)
def streak_recovery_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    streak = db.query(Streak).filter(Streak.user_id == user.id).first()
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    in_recovery = (
        streak is not None
        and streak.recovery_expires_at is not None
        and streak.recovery_expires_at > now
    )
    completions_today = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user.id,
        TaskCompletion.completed_at >= today_start,
    ).count()

    minutes_remaining = None
    if in_recovery and streak.recovery_expires_at:
        minutes_remaining = int((streak.recovery_expires_at - now).total_seconds() / 60)

    return StreakRecoveryStatus(
        in_recovery=in_recovery,
        recovery_expires_at=streak.recovery_expires_at if streak else None,
        minutes_remaining=minutes_remaining,
        completions_needed=2,
        completions_today=completions_today,
    )
