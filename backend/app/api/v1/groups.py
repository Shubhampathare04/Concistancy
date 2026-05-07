from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.utils.deps import get_current_user
from app.models.models import User
from app.schemas.social import (
    GroupCreate, GroupUpdate, GroupResponse, GroupMemberResponse,
    ChallengeCreate, ChallengeResponse, ChallengeParticipantResponse
)
from app.services.social_service import SocialService

router = APIRouter()


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group"""
    return SocialService.create_group(db, current_user.id, group_data)


@router.get("/", response_model=List[GroupResponse])
def get_user_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get groups user is a member of"""
    return SocialService.get_groups(db, current_user.id)


@router.get("/discover", response_model=List[GroupResponse])
def discover_groups(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover public groups"""
    return SocialService.discover_groups(db, current_user.id, limit)


@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details"""
    from app.models.social import Group
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    return group


@router.post("/{group_id}/join", response_model=GroupMemberResponse)
def join_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a group"""
    return SocialService.join_group(db, group_id, current_user.id)


@router.post("/{group_id}/leave")
def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a group"""
    return SocialService.leave_group(db, group_id, current_user.id)


@router.get("/{group_id}/members", response_model=List[GroupMemberResponse])
def get_group_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group members"""
    from app.models.social import GroupMember
    return db.query(GroupMember).filter(GroupMember.group_id == group_id).all()


@router.post("/{group_id}/challenges", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(
    group_id: int,
    challenge_data: ChallengeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a group challenge"""
    return SocialService.create_challenge(db, group_id, current_user.id, challenge_data)


@router.get("/{group_id}/challenges", response_model=List[ChallengeResponse])
def get_group_challenges(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group challenges"""
    from app.models.social import GroupChallenge
    return db.query(GroupChallenge).filter(GroupChallenge.group_id == group_id).all()


@router.post("/{group_id}/challenges/{challenge_id}/join", response_model=ChallengeParticipantResponse)
def join_challenge(
    group_id: int,
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a challenge"""
    return SocialService.join_challenge(db, challenge_id, current_user.id)


@router.get("/{group_id}/challenges/{challenge_id}/participants", response_model=List[ChallengeParticipantResponse])
def get_challenge_participants(
    group_id: int,
    challenge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get challenge participants"""
    from app.models.social import ChallengeParticipant
    return db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == challenge_id
    ).all()
