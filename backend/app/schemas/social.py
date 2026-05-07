from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ConnectionRequest(BaseModel):
    connected_user_id: int


class ConnectionResponse(BaseModel):
    id: int
    user_id: int
    connected_user_id: int
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True


class ConnectionWithUser(BaseModel):
    id: int
    user_id: int
    connected_user_id: int
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None
    user: UserBasic
    connected_user: UserBasic
    
    class Config:
        from_attributes = True


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    is_private: bool = False


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    is_private: Optional[bool] = None


class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    created_by: int
    is_private: bool
    member_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserBasic
    
    class Config:
        from_attributes = True


class ChallengeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    goal_type: str
    goal_value: int = Field(..., gt=0)
    start_date: datetime
    end_date: datetime


class ChallengeResponse(BaseModel):
    id: int
    group_id: int
    title: str
    description: Optional[str] = None
    goal_type: str
    goal_value: int
    created_by: int
    start_date: datetime
    end_date: datetime
    participant_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChallengeParticipantResponse(BaseModel):
    id: int
    challenge_id: int
    user_id: int
    progress: int
    completed: bool
    joined_at: datetime
    completed_at: Optional[datetime] = None
    user: UserBasic
    
    class Config:
        from_attributes = True


class ActivityFeedResponse(BaseModel):
    id: int
    user_id: int
    activity_type: str
    data: Optional[str] = None
    visibility: str
    created_at: datetime
    user: UserBasic
    
    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    level: int
    xp: int
    streak: int
    rank: int
