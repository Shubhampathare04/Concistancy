from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    user: UserOut

# Tasks
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: int = 1
    estimated_minutes: Optional[int] = None
    schedule_type: str = "daily"

class TaskOut(BaseModel):
    id: int
    title: str
    difficulty: int
    schedule_type: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

# Dashboard
class DashboardOut(BaseModel):
    tasks: List[TaskOut]
    streak: int
    xp: int
    level: int
    suggestions: List[str]
