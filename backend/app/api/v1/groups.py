from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.schemas.schemas import (
    GroupCreate, GroupOut, GroupMemberOut,
    GroupChallengeCreate, GroupChallengeOut, GroupChallengeProgressOut,
    GroupMessageCreate, GroupMessageOut, MessageReactionOut,
    GroupFeedItem, GroupLeaderboardEntry,
)
from app.models.models import (
    Group, GroupMember, GroupChallenge, GroupChallengeProgress,
    GroupMessage, MessageReaction,
    User, UserStats, Streak, ActivityLog, TaskCompletion,
)
from app.utils.deps import get_current_user

router = APIRouter()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _enrich_group(g: Group, user_id: int, db: Session) -> GroupOut:
    count = db.query(GroupMember).filter(GroupMember.group_id == g.id, GroupMember.is_active == True).count()
    membership = db.query(GroupMember).filter(GroupMember.group_id == g.id, GroupMember.user_id == user_id, GroupMember.is_active == True).first()
    out = GroupOut.model_validate(g)
    out.member_count = count
    out.is_member = membership is not None
    out.is_admin = membership is not None and membership.role == "admin"
    return out


def _post_system_message(group_id: int, content: str, db: Session):
    db.add(GroupMessage(group_id=group_id, sender_id=0, content=content, message_type="system"))


def _enrich_message(msg: GroupMessage, user_id: int, db: Session) -> GroupMessageOut:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    reactions_raw = db.query(
        MessageReaction.emoji, func.count(MessageReaction.id).label("cnt")
    ).filter(MessageReaction.message_id == msg.id).group_by(MessageReaction.emoji).all()
    reactions = []
    for r in reactions_raw:
        reacted = db.query(MessageReaction).filter(
            MessageReaction.message_id == msg.id,
            MessageReaction.user_id == user_id,
            MessageReaction.emoji == r.emoji,
        ).first() is not None
        reactions.append(MessageReactionOut(emoji=r.emoji, count=r.cnt, reacted_by_me=reacted))
    out = GroupMessageOut.model_validate(msg)
    out.sender_name = sender.name if sender else "System"
    out.reactions = reactions
    return out


# ─── Group CRUD ───────────────────────────────────────────────────────────────

@router.post("/", response_model=GroupOut)
def create_group(data: GroupCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = Group(
        name=data.name, description=data.description,
        avatar_emoji=data.avatar_emoji, created_by=user.id,
        is_public=data.is_public, max_members=data.max_members,
    )
    db.add(group)
    db.flush()
    db.add(GroupMember(group_id=group.id, user_id=user.id, role="admin"))
    _post_system_message(group.id, f"Group created by {user.name or 'someone'}. Welcome! 🎉", db)
    db.commit()
    db.refresh(group)
    return _enrich_group(group, user.id, db)


@router.get("/", response_model=List[GroupOut])
def list_my_groups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memberships = db.query(GroupMember).filter(GroupMember.user_id == user.id, GroupMember.is_active == True).all()
    groups = [db.query(Group).filter(Group.id == m.group_id).first() for m in memberships]
    return [_enrich_group(g, user.id, db) for g in groups if g]


@router.get("/discover", response_model=List[GroupOut])
def discover_groups(
    limit: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = db.query(Group).filter(Group.is_public == True).all()
    enriched = [_enrich_group(g, user.id, db) for g in groups]
    enriched.sort(key=lambda g: g.member_count, reverse=True)
    return enriched[:limit]


@router.get("/{group_id}", response_model=GroupOut)
def get_group(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return _enrich_group(g, user.id, db)


@router.post("/{group_id}/join")
def join_group(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = db.query(Group).filter(Group.id == group_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    count = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.is_active == True).count()
    if count >= g.max_members:
        raise HTTPException(status_code=400, detail="Group is full")
    existing = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id).first()
    if existing:
        existing.is_active = True
    else:
        db.add(GroupMember(group_id=group_id, user_id=user.id, role="member"))
    _post_system_message(group_id, f"{user.name or 'Someone'} joined the group 👋", db)
    db.commit()
    return {"status": "joined"}


@router.post("/{group_id}/leave")
def leave_group(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id).first()
    if m:
        m.is_active = False
    _post_system_message(group_id, f"{user.name or 'Someone'} left the group", db)
    db.commit()
    return {"status": "left"}


@router.delete("/{group_id}")
def delete_group(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id, GroupMember.role == "admin").first()
    if not m:
        raise HTTPException(status_code=403, detail="Admin only")
    db.query(GroupMember).filter(GroupMember.group_id == group_id).delete()
    db.query(GroupMessage).filter(GroupMessage.group_id == group_id).delete()
    db.query(Group).filter(Group.id == group_id).delete()
    db.commit()
    return {"status": "deleted"}


# ─── Members ─────────────────────────────────────────────────────────────────

@router.get("/{group_id}/members", response_model=List[GroupMemberOut])
def get_members(group_id: int, db: Session = Depends(get_db)):
    members = db.query(GroupMember).options(
        joinedload(GroupMember.user)
    ).filter(GroupMember.group_id == group_id, GroupMember.is_active == True).all()
    result = []
    for m in members:
        stats = db.query(UserStats).filter(UserStats.user_id == m.user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == m.user_id).first()
        result.append(GroupMemberOut(
            user_id=m.user_id,
            name=m.user.name if m.user else None,
            role=m.role,
            streak=streak.current_streak if streak else 0,
            level=stats.level if stats else 1,
            xp=stats.xp if stats else 0,
            joined_at=m.joined_at,
        ))
    return result


# ─── Challenges ──────────────────────────────────────────────────────────────

@router.post("/{group_id}/challenges", response_model=GroupChallengeOut)
def create_challenge(
    group_id: int, data: GroupChallengeCreate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    m = db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.user_id == user.id, GroupMember.is_active == True).first()
    if not m:
        raise HTTPException(status_code=403, detail="Must be a member")
    challenge = GroupChallenge(group_id=group_id, created_by=user.id, **data.model_dump())
    db.add(challenge)
    db.flush()
    _post_system_message(group_id, f"🏆 New challenge: \"{data.title}\" — {data.target_value} {data.target_unit}. Ends {data.end_date.strftime('%b %d')}.", db)
    db.commit()
    db.refresh(challenge)
    return _enrich_challenge(challenge, user.id, db)


@router.get("/{group_id}/challenges", response_model=List[GroupChallengeOut])
def list_challenges(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    challenges = db.query(GroupChallenge).filter(GroupChallenge.group_id == group_id).order_by(GroupChallenge.created_at.desc()).all()
    return [_enrich_challenge(c, user.id, db) for c in challenges]


@router.post("/{group_id}/challenges/{challenge_id}/progress")
def log_progress(
    group_id: int, challenge_id: int, value: int,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    challenge = db.query(GroupChallenge).filter(GroupChallenge.id == challenge_id, GroupChallenge.group_id == group_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    prog = db.query(GroupChallengeProgress).filter(
        GroupChallengeProgress.challenge_id == challenge_id,
        GroupChallengeProgress.user_id == user.id,
    ).first()
    if not prog:
        prog = GroupChallengeProgress(challenge_id=challenge_id, user_id=user.id, current_value=0)
        db.add(prog)
    prog.current_value = min(prog.current_value + value, challenge.target_value)
    just_completed = prog.current_value >= challenge.target_value and not prog.completed_at
    if just_completed:
        prog.completed_at = datetime.utcnow()
        # Award coins
        stats = db.query(UserStats).filter(UserStats.user_id == user.id).first()
        if stats:
            stats.coins = (stats.coins or 0) + challenge.reward_coins
        _post_system_message(group_id, f"🎉 {user.name or 'Someone'} completed the challenge \"{challenge.title}\"! +{challenge.reward_coins} coins", db)
    db.commit()
    return {"current_value": prog.current_value, "target": challenge.target_value, "completed": just_completed}


@router.get("/{group_id}/challenges/{challenge_id}/leaderboard")
def challenge_leaderboard(group_id: int, challenge_id: int, db: Session = Depends(get_db)):
    progresses = db.query(GroupChallengeProgress).filter(
        GroupChallengeProgress.challenge_id == challenge_id
    ).order_by(GroupChallengeProgress.current_value.desc()).all()
    result = []
    for i, p in enumerate(progresses):
        u = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "rank": i + 1,
            "user_id": p.user_id,
            "name": u.name if u else "User",
            "current_value": p.current_value,
            "completed": p.completed_at is not None,
        })
    return result


def _enrich_challenge(c: GroupChallenge, user_id: int, db: Session) -> GroupChallengeOut:
    count = db.query(GroupChallengeProgress).filter(GroupChallengeProgress.challenge_id == c.id).count()
    prog = db.query(GroupChallengeProgress).filter(
        GroupChallengeProgress.challenge_id == c.id,
        GroupChallengeProgress.user_id == user_id,
    ).first()
    out = GroupChallengeOut.model_validate(c)
    out.participant_count = count
    out.my_progress = prog.current_value if prog else 0
    out.my_completed = prog.completed_at is not None if prog else False
    return out


# ─── Messages / Chat ─────────────────────────────────────────────────────────

@router.get("/{group_id}/messages", response_model=List[GroupMessageOut])
def get_messages(
    group_id: int,
    limit: int = Query(50, ge=1, le=100),
    before_id: int = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_member(group_id, user.id, db)
    q = db.query(GroupMessage).options(
        joinedload(GroupMessage.sender)
    ).filter(GroupMessage.group_id == group_id)
    if before_id:
        q = q.filter(GroupMessage.id < before_id)
    msgs = q.order_by(GroupMessage.created_at.asc()).limit(limit).all()
    return [_enrich_message(m, user.id, db) for m in msgs]


@router.post("/{group_id}/messages", response_model=GroupMessageOut)
def send_message(
    group_id: int, data: GroupMessageCreate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    _require_member(group_id, user.id, db)
    msg = GroupMessage(group_id=group_id, sender_id=user.id, content=data.content, message_type="text")
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _enrich_message(msg, user.id, db)


@router.post("/{group_id}/messages/{message_id}/react")
def add_reaction(
    group_id: int, message_id: int, emoji: str,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == user.id,
        MessageReaction.emoji == emoji,
    ).first()
    if not existing:
        db.add(MessageReaction(message_id=message_id, user_id=user.id, emoji=emoji))
        db.commit()
    return {"status": "reacted"}


@router.delete("/{group_id}/messages/{message_id}/react")
def remove_reaction(
    group_id: int, message_id: int, emoji: str,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == user.id,
        MessageReaction.emoji == emoji,
    ).delete()
    db.commit()
    return {"status": "removed"}


# ─── Feed & Leaderboard ───────────────────────────────────────────────────────

@router.get("/{group_id}/feed", response_model=List[GroupFeedItem])
def group_feed(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _require_member(group_id, user.id, db)
    member_ids = [
        m.user_id for m in
        db.query(GroupMember).filter(GroupMember.group_id == group_id, GroupMember.is_active == True).all()
    ]
    logs = db.query(ActivityLog).options(
        joinedload(ActivityLog.user)
    ).filter(
        ActivityLog.user_id.in_(member_ids),
        ActivityLog.action_type.in_(["TASK_COMPLETED", "FOCUS_SESSION_END"]),
    ).order_by(ActivityLog.created_at.desc()).limit(50).all()
    result = []
    for log in logs:
        detail = None
        if log.action_type == "TASK_COMPLETED" and log.meta:
            detail = f"+{log.meta.get('xp_gained', 0)} XP"
        elif log.action_type == "FOCUS_SESSION_END" and log.meta:
            detail = f"{log.meta.get('duration_minutes', 0)} min focus"
        result.append(GroupFeedItem(
            user_id=log.user_id,
            user_name=log.user.name or "User" if log.user else "User",
            action=log.action_type.replace("_", " ").title(),
            detail=detail,
            created_at=log.created_at,
        ))
    return result


@router.get("/{group_id}/leaderboard", response_model=List[GroupLeaderboardEntry])
def group_leaderboard(
    group_id: int,
    by: str = Query("xp", enum=["xp", "streak", "completions"]),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    members = db.query(GroupMember).options(
        joinedload(GroupMember.user)
    ).filter(GroupMember.group_id == group_id, GroupMember.is_active == True).all()
    entries = []
    for m in members:
        stats = db.query(UserStats).filter(UserStats.user_id == m.user_id).first()
        streak = db.query(Streak).filter(Streak.user_id == m.user_id).first()
        completions = db.query(TaskCompletion).filter(TaskCompletion.user_id == m.user_id).count()
        entries.append(GroupLeaderboardEntry(
            user_id=m.user_id,
            name=m.user.name or "User" if m.user else "User",
            streak=streak.current_streak if streak else 0,
            xp=stats.xp if stats else 0,
            level=stats.level if stats else 1,
            completions_in_group=completions,
            rank=0,
        ))
    if by == "streak":
        entries.sort(key=lambda e: e.streak, reverse=True)
    elif by == "completions":
        entries.sort(key=lambda e: e.completions_in_group, reverse=True)
    else:
        entries.sort(key=lambda e: e.xp, reverse=True)
    for i, e in enumerate(entries):
        e.rank = i + 1
    return entries


def _require_member(group_id: int, user_id: int, db: Session):
    m = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.is_active == True,
    ).first()
    if not m:
        raise HTTPException(status_code=403, detail="Must be a group member")
