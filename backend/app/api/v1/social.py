from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.db.session import get_db
from app.utils.deps import get_current_user
from app.models.models import User
from app.schemas.social import (
    ConnectionRequest, ConnectionResponse, ConnectionWithUser,
    GroupCreate, GroupUpdate, GroupResponse, GroupMemberResponse,
    ChallengeCreate, ChallengeResponse, ChallengeParticipantResponse,
    ActivityFeedResponse, LeaderboardEntry
)
from app.services.social_service import SocialService
from app.core.cache import cache_get, cache_set, cache_delete_pattern

router = APIRouter()


@router.post("/connections/request", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
def send_connection_request(
    request: ConnectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a connection request to another user"""
    result = SocialService.send_connection_request(db, current_user.id, request.connected_user_id)
    # Invalidate connections cache
    cache_delete_pattern(f"connections:{current_user.id}*")
    cache_delete_pattern(f"connections:{request.connected_user_id}*")
    return result


@router.get("/connections", response_model=List[ConnectionWithUser])
def get_connections(
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's connections with pagination"""
    cache_key = f"connections:{current_user.id}:{status or 'all'}:p{page}:s{page_size}"
    
    # Try cache
    cached = cache_get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            return [ConnectionWithUser(**item) for item in data]
        except Exception:
            pass
    
    # Get fresh data
    result = SocialService.get_connections(db, current_user.id, status, page=page, page_size=page_size)
    
    # Cache for 5 minutes
    try:
        cache_set(cache_key, json.dumps([r.model_dump() for r in result]), ttl=300)
    except Exception:
        pass
    
    return result


@router.post("/connections/{connection_id}/accept", response_model=ConnectionResponse)
def accept_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a connection request"""
    result = SocialService.accept_connection(db, connection_id, current_user.id)
    # Invalidate caches
    cache_delete_pattern(f"connections:{current_user.id}*")
    cache_delete_pattern(f"leaderboard:{current_user.id}")
    cache_delete_pattern(f"feed:{current_user.id}")
    return result


@router.post("/connections/{connection_id}/reject", response_model=ConnectionResponse)
def reject_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject a connection request"""
    result = SocialService.reject_connection(db, connection_id, current_user.id)
    # Invalidate connections cache
    cache_delete_pattern(f"connections:{current_user.id}*")
    return result


@router.delete("/connections/{connection_id}")
def remove_connection(
    connection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a connection"""
    result = SocialService.remove_connection(db, connection_id, current_user.id)
    # Invalidate caches
    cache_delete_pattern(f"connections:{current_user.id}*")
    cache_delete_pattern(f"leaderboard:{current_user.id}")
    cache_delete_pattern(f"feed:{current_user.id}")
    return result


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get leaderboard of connected users"""
    cache_key = f"leaderboard:{current_user.id}"
    
    # Try cache
    cached = cache_get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            return [LeaderboardEntry(**item) for item in data]
        except Exception:
            pass
    
    # Get fresh data
    result = SocialService.get_leaderboard(db, current_user.id, limit)
    
    # Cache for 5 minutes
    try:
        cache_set(cache_key, json.dumps([r.model_dump() for r in result]), ttl=300)
    except Exception:
        pass
    
    return result


@router.get("/feed", response_model=List[ActivityFeedResponse])
def get_activity_feed(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity feed from connections"""
    cache_key = f"feed:{current_user.id}"
    
    # Try cache
    cached = cache_get(cache_key)
    if cached:
        try:
            data = json.loads(cached)
            return [ActivityFeedResponse(**item) for item in data]
        except Exception:
            pass
    
    # Get fresh data
    result = SocialService.get_activity_feed(db, current_user.id, limit)
    
    # Cache for 1 minute (feed updates frequently)
    try:
        cache_set(cache_key, json.dumps([r.model_dump() for r in result]), ttl=60)
    except Exception:
        pass
    
    return result
