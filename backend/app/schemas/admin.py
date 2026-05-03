from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


# Admin Auth
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class AdminUserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    role: str
    is_active: bool
    last_login_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# User Management
class UserListResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    is_active: bool
    is_onboarded: bool
    banned_at: Optional[datetime]
    created_at: datetime
    total_completions: int = 0
    current_streak: int = 0
    level: int = 1

    class Config:
        from_attributes = True


class UserDetailResponse(UserListResponse):
    goal: Optional[str]
    timezone: str
    email_verified: bool
    xp: int = 0
    coins: int = 0
    longest_streak: int = 0
    consistency_index: float = 0.0
    subscription_plan: str = "free"


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    email_verified: Optional[bool] = None


class UserBanRequest(BaseModel):
    reason: str


# Analytics
class AnalyticsOverview(BaseModel):
    total_users: int
    active_users_today: int
    active_users_7d: int
    active_users_30d: int
    total_tasks: int
    total_completions: int
    completion_rate: float
    avg_streak: float
    total_revenue: float
    mrr: float
    active_subscriptions: int


class UserGrowthData(BaseModel):
    date: str
    new_users: int
    total_users: int
    dau: int


class TaskAnalytics(BaseModel):
    total_tasks: int
    active_tasks: int
    avg_difficulty: float
    completion_rate: float
    total_completions: int
    completions_today: int
    completions_7d: int


class StreakDistribution(BaseModel):
    range: str
    count: int


# Subscriptions
class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    user_name: Optional[str]
    plan: str
    status: str
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionCreateRequest(BaseModel):
    user_id: int
    plan: str = Field(..., pattern="^(free|pro|elite)$")
    duration_days: int = 30


class SubscriptionUpdateRequest(BaseModel):
    plan: Optional[str] = Field(None, pattern="^(free|pro|elite)$")
    status: Optional[str] = Field(None, pattern="^(active|expired|cancelled)$")
    duration_days: Optional[int] = None


# Payments
class PaymentResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    amount: float
    currency: str
    status: str
    provider: str
    created_at: datetime

    class Config:
        from_attributes = True


# System Health
class SystemHealth(BaseModel):
    status: str
    mysql: bool
    redis: bool
    mongodb: bool
    api_latency_ms: float
    uptime_seconds: float


class SystemMetrics(BaseModel):
    total_requests_24h: int
    error_rate: float
    avg_response_time_ms: float
    active_connections: int
    cache_hit_rate: float


# Audit Logs
class AuditLogResponse(BaseModel):
    id: int
    admin_id: int
    admin_email: str
    action: str
    entity_type: str
    entity_id: Optional[int]
    meta_data: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


# Pagination
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
