from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.session import get_db
from app.schemas.schemas import PublicProfile, FeedItem, MessageOut, MessageCreate, LeaderboardEntry
from app.models.models import Follow, User, UserStats, Streak, ActivityLog, Message
from app.utils.deps import get_current_user
from datetime import datetime

router = APIRouter()


def _room_id(a: int, b: int) -> str:
    return f"dm_{min(a, b)}_{max(a, b)}"


@router.post("/follow/{target_id}")
def follow(target_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if target_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    target = db.query(User).filter(User.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(Follow).filter(
        Follow.follower_id == user.id, Follow.following_id == target_id
    ).first()
    if existing:
        return {"status": "already_following"}
    db.add(Follow(follower_id=user.id, following_id=target_id))
    db.commit()
    return {"status": "following"}


@router.delete("/follow/{target_id}")
def unfollow(target_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Follow).filter(
        Follow.follower_id == user.id, Follow.following_id == target_id
    ).delete()
    db.commit()
    return {"status": "unfollowed"}


@router.get("/feed", response_model=List[FeedItem])
def feed(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    following_ids = [
        f.following_id for f in
        db.query(Follow).filter(Follow.follower_id == user.id).all()
    ]
    if not following_ids:
        return []
    logs = db.query(ActivityLog).options(
        joinedload(ActivityLog.user)
    ).filter(
        ActivityLog.user_id.in_(following_ids)
    ).order_by(ActivityLog.created_at.desc()).limit(50).all()

    result = []
    for log in logs:
        result.append(FeedItem(
            user_id=log.user_id,
            user_name=log.user.name or "User" if log.user else "User",
            action_type=log.action_type,
            meta=log.meta,
            created_at=log.created_at,
        ))
    return result


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def leaderboard(
    by: str = Query("xp", enum=["xp", "streak", "coins"]),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # Join with User to filter out deleted/inactive users
    stats_rows = db.query(UserStats).join(
        User, UserStats.user_id == User.id
    ).filter(
        User.is_active == True,
        User.deleted_at == None
    ).order_by(
        UserStats.xp.desc() if by == "xp" else
        UserStats.coins.desc() if by == "coins" else
        UserStats.xp.desc()
    ).limit(limit).all()

    result = []
    for i, s in enumerate(stats_rows):
        user = db.query(User).filter(User.id == s.user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == s.user_id).first()
        cur_streak = streak.current_streak if streak else 0
        result.append(LeaderboardEntry(
            user_id=s.user_id,
            name=user.name or "User" if user else "User",
            xp=s.xp,
            streak=cur_streak,
            coins=s.coins or 0,
            level=s.level,
            rank=i + 1,
        ))

    if by == "streak":
        result.sort(key=lambda x: x.streak, reverse=True)
        for i, r in enumerate(result):
            r.rank = i + 1

    return result


@router.get("/search", response_model=List[PublicProfile])
def search_users(
    q: str = Query(..., min_length=2),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(
        User.name.ilike(f"%{q}%"),
        User.is_active == True,
        User.id != user.id,
    ).limit(20).all()
    return [_to_public(u, user.id, db) for u in users]


@router.get("/users/{target_id}", response_model=PublicProfile)
def public_profile(target_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_public(target, user.id, db)


@router.get("/messages/{other_id}", response_model=List[MessageOut])
def get_messages(
    other_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = _room_id(user.id, other_id)
    msgs = db.query(Message).filter(
        Message.room_id == room
    ).order_by(Message.created_at.asc()).limit(100).all()
    # Mark as read
    db.query(Message).filter(
        Message.room_id == room,
        Message.sender_id != user.id,
        Message.read_at == None,
    ).update({"read_at": datetime.utcnow()})
    db.commit()
    return msgs


@router.post("/messages/{other_id}", response_model=MessageOut)
def send_message(
    other_id: int,
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = _room_id(user.id, other_id)
    msg = Message(room_id=room, sender_id=user.id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def _to_public(target: User, viewer_id: int, db: Session) -> PublicProfile:
    stats = db.query(UserStats).filter(UserStats.user_id == target.id).first()
    streak = db.query(Streak).filter(Streak.user_id == target.id).first()
    is_following = db.query(Follow).filter(
        Follow.follower_id == viewer_id, Follow.following_id == target.id
    ).first() is not None
    return PublicProfile(
        id=target.id,
        name=target.name,
        level=stats.level if stats else 1,
        streak=streak.current_streak if streak else 0,
        xp=stats.xp if stats else 0,
        coins=stats.coins if stats else 0,
        consistency_index=stats.consistency_index if stats else 0.0,
        is_following=is_following,
    )
