from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime, time
from app.utils.sanitization import sanitize_text, sanitize_difficulty, validate_password

# ─── Auth ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        # Use enhanced password validation
        validate_password(v)
        return v

    @field_validator("name")
    @classmethod
    def name_sanitize(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        # Sanitize and limit length
        sanitized = sanitize_text(v, max_length=100)
        if not sanitized:
            raise ValueError("Name cannot be empty after sanitization")
        return sanitized

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str]
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str

class TokenRefreshOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# ─── Tasks ───────────────────────────────────────────────────────────────────

VALID_SENSOR_TYPES = {"steps", "timer", "reps", "water", "none"}

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: int = 1
    estimated_minutes: Optional[int] = None
    schedule_type: str = "daily"
    target: Optional[int] = None
    sensor_type: Optional[str] = None

    @field_validator("difficulty")
    @classmethod
    def difficulty_range(cls, v: int) -> int:
        return sanitize_difficulty(v)

    @field_validator("title")
    @classmethod
    def title_sanitize(cls, v: str) -> str:
        sanitized = sanitize_text(v, max_length=255)
        if not sanitized:
            raise ValueError("Title cannot be empty")
        return sanitized
    
    @field_validator("description")
    @classmethod
    def description_sanitize(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        return sanitize_text(v, max_length=2000)

    @field_validator("sensor_type")
    @classmethod
    def sensor_type_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_SENSOR_TYPES:
            raise ValueError(f"sensor_type must be one of {VALID_SENSOR_TYPES}")
        return v

    @field_validator("target")
    @classmethod
    def target_positive(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("target must be a positive integer")
        return v
    
    @field_validator("estimated_minutes")
    @classmethod
    def estimated_minutes_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 1440):  # Max 24 hours
            raise ValueError("estimated_minutes must be between 1 and 1440")
        return v

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[int] = None
    estimated_minutes: Optional[int] = None
    schedule_type: Optional[str] = None
    target: Optional[int] = None
    sensor_type: Optional[str] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    difficulty: int
    estimated_minutes: Optional[int]
    schedule_type: str
    is_active: bool
    created_at: datetime
    target: Optional[int] = None
    sensor_type: Optional[str] = None
    model_config = {"from_attributes": True}

class CompleteTaskRequest(BaseModel):
    idempotency_key: str
    duration_minutes: Optional[int] = None

class CompleteTaskOut(BaseModel):
    status: str
    xp_gained: int
    new_streak: int
    new_xp: int
    new_level: int
    consistency_index: float
    level_up: bool

# ─── Pagination ──────────────────────────────────────────────────────────────

class PaginatedTasks(BaseModel):
    items: List[TaskOut]
    total: int
    page: int
    page_size: int
    has_next: bool

# ─── Dashboard ───────────────────────────────────────────────────────────────

class AIInsight(BaseModel):
    type: str           # "suggestion" | "warning" | "achievement"
    message: str
    priority: int       # 1 = high, 3 = low

class DashboardOut(BaseModel):
    tasks: List[TaskOut]
    streak: int
    longest_streak: int
    xp: int
    level: int
    coins: int
    consistency_index: float
    total_completions: int
    insights: List[AIInsight]
    suggestions: List[str]  # kept for backward compat

# ─── AI / Behavior ───────────────────────────────────────────────────────────

class BehaviorScoreOut(BaseModel):
    task_id: int
    success_rate: float
    predicted_success_prob: float
    recommended_difficulty: int
    avg_completion_hour: Optional[float]
    computed_at: datetime
    model_config = {"from_attributes": True}

class ConsistencyReport(BaseModel):
    user_id: int
    consistency_index: float
    weekly_completion_rate: float
    best_day_of_week: Optional[str]
    best_hour_of_day: Optional[int]
    total_completions_7d: int
    total_completions_30d: int
    streak_health: str  # "strong" | "at_risk" | "broken"

# ─── Sync ────────────────────────────────────────────────────────────────────

class SyncAction(BaseModel):
    action_type: str
    payload: Dict[str, Any]
    idempotency_key: str
    client_timestamp: datetime

class SyncBatchRequest(BaseModel):
    actions: List[SyncAction]

class SyncBatchResult(BaseModel):
    processed: int
    failed: int
    results: List[Dict[str, Any]]

# ─── Ranks & Coins ───────────────────────────────────────────────────────────

class CoinTier(BaseModel):
    tier: str           # "bronze" | "silver" | "gold" | "diamond" | "legend"
    label: str
    coins: int
    next_tier: Optional[str]
    coins_to_next: Optional[int]
    color: str
    icon: str

class RankOut(BaseModel):
    rank_title: str
    rank_tier: str      # "bronze" | "silver" | "gold" | "diamond" | "legend"
    level: int
    xp: int
    coins: int
    streak: int
    consistency_index: float
    coin_tier: CoinTier
    badges: List[str]   # earned badge keys

# ─── Analytics ───────────────────────────────────────────────────────────────

class WeeklyAnalyticsOut(BaseModel):
    week_start: str
    completions: int
    skips: int
    completion_rate: float
    avg_difficulty: float
    xp_earned: int
    consistency_index_snapshot: float

class WeeklyTrendOut(BaseModel):
    weeks: List[WeeklyAnalyticsOut]
    week_over_week: Optional[Dict[str, float]]

class EventPayload(BaseModel):
    """Used by internal tooling / admin to inspect recent events."""
    user_id: int
    action_type: str
    meta: Optional[Dict[str, Any]]
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── FCM ─────────────────────────────────────────────────────────────────────

class FCMTokenRegister(BaseModel):
    token: str
    platform: str = "expo"

# ─── Auth Me ─────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: int
    email: str
    name: Optional[str]
    goal: Optional[str]
    timezone: str
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── Habits ──────────────────────────────────────────────────────────────────

class HabitCreate(BaseModel):
    title: str
    category: str = "other"
    frequency: str = "daily"
    reminder_time: Optional[str] = None  # "HH:MM"

class HabitOut(BaseModel):
    id: int
    title: str
    category: str
    frequency: str
    reminder_time: Optional[Any]
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class HabitLogOut(BaseModel):
    id: int
    habit_id: int
    logged_at: datetime
    note: Optional[str]
    model_config = {"from_attributes": True}

# ─── Events ──────────────────────────────────────────────────────────────────

class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    type: str
    start_date: datetime
    end_date: datetime
    reward_coins: int
    is_active: bool
    participant_count: int = 0
    user_joined: bool = False
    model_config = {"from_attributes": True}

class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    xp: int
    streak: int
    coins: int
    level: int
    rank: int

# ─── Social ──────────────────────────────────────────────────────────────────

class PublicProfile(BaseModel):
    id: int
    name: Optional[str]
    level: int
    streak: int
    xp: int
    coins: int
    consistency_index: float
    is_following: bool = False

class FeedItem(BaseModel):
    user_id: int
    user_name: str
    action_type: str
    meta: Optional[Dict[str, Any]]
    created_at: datetime

class MessageOut(BaseModel):
    id: int
    room_id: str
    sender_id: int
    content: str
    created_at: datetime
    read_at: Optional[datetime]
    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    content: str

# ─── Professionals ───────────────────────────────────────────────────────────

class ProfessionalOut(BaseModel):
    id: int
    user_id: int
    specialty: str
    bio: Optional[str]
    hourly_rate: float
    is_verified: bool
    name: Optional[str] = None
    model_config = {"from_attributes": True}

class ProfessionalCreate(BaseModel):
    specialty: str
    bio: Optional[str] = None
    hourly_rate: float = 0.0

class ConsultationCreate(BaseModel):
    professional_id: int
    scheduled_at: datetime
    notes: Optional[str] = None

class ConsultationOut(BaseModel):
    id: int
    professional_id: int
    client_id: int
    scheduled_at: datetime
    status: str
    notes: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}

# ─── Subscriptions ───────────────────────────────────────────────────────────

class SubscriptionOut(BaseModel):
    plan: str
    status: str
    expires_at: Optional[datetime]
    streak_freeze_count: int
    model_config = {"from_attributes": True}

class SubscribeRequest(BaseModel):
    plan: str  # "pro" | "elite"

# ─── AI ──────────────────────────────────────────────────────────────────────

class AISuggestRequest(BaseModel):
    title: str
    description: Optional[str] = None

class AISuggestResponse(BaseModel):
    suggestions: List[str]
    detected_sensor: str
    detected_target: Optional[int]
    predicted_difficulty: int

class WeeklyReportOut(BaseModel):
    week_start: str
    completions: int
    xp_earned: int
    consistency_index: float
    streak: int
    top_insight: Optional[str]
    improvement_tip: str


# ─── Onboarding ──────────────────────────────────────────────────────────────

class OnboardRequest(BaseModel):
    goal: str
    starter_task_titles: List[str]
    reminder_hour: int = 9  # 0-23


# ─── Mood ────────────────────────────────────────────────────────────────────

class MoodLogCreate(BaseModel):
    mood: int    # 1-5
    energy: int  # 1-5
    task_id: Optional[int] = None

    @field_validator("mood", "energy")
    @classmethod
    def in_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Must be 1-5")
        return v

class MoodLogOut(BaseModel):
    id: int
    mood: int
    energy: int
    task_id: Optional[int]
    created_at: datetime
    model_config = {"from_attributes": True}

class MoodTrend(BaseModel):
    avg_mood: float
    avg_energy: float
    best_mood_day: Optional[str]
    mood_performance_insight: Optional[str]


# ─── Personal Records ────────────────────────────────────────────────────────

class PersonalRecordOut(BaseModel):
    id: int
    task_id: Optional[int]
    record_type: str
    value: float
    achieved_at: datetime
    model_config = {"from_attributes": True}


# ─── Consistency History ─────────────────────────────────────────────────────

class ConsistencySnapshotOut(BaseModel):
    score: float
    snapped_at: str

class ConsistencyHistoryOut(BaseModel):
    snapshots: List[ConsistencySnapshotOut]
    trend: str  # "up" | "down" | "stable"
    delta_7d: float


# ─── Rival ───────────────────────────────────────────────────────────────────

class RivalOut(BaseModel):
    rival_id: int
    rival_name: str
    rival_streak: int
    rival_today_completions: int
    my_today_completions: int
    leading: bool


# ─── XP Multiplier ───────────────────────────────────────────────────────────

class XPMultiplierOut(BaseModel):
    active: bool
    multiplier: float
    ends_at: Optional[datetime]
    minutes_remaining: Optional[int]


# ─── Task Reminder ───────────────────────────────────────────────────────────

class TaskReminderCreate(BaseModel):
    remind_at: str   # "HH:MM"
    days_of_week: List[int] = [0, 1, 2, 3, 4, 5, 6]

class TaskReminderOut(BaseModel):
    id: int
    task_id: int
    remind_at: Any
    days_of_week: Any
    is_active: bool
    model_config = {"from_attributes": True}


# ─── Streak Recovery ─────────────────────────────────────────────────────────

class StreakRecoveryStatus(BaseModel):
    in_recovery: bool
    recovery_expires_at: Optional[datetime]
    minutes_remaining: Optional[int]
    completions_needed: int
    completions_today: int


# ─── Habit Streak ────────────────────────────────────────────────────────────

class HabitStreakOut(BaseModel):
    habit_id: int
    current_streak: int
    longest_streak: int
    last_logged_date: Optional[str]
    model_config = {"from_attributes": True}


# ─── Search ──────────────────────────────────────────────────────────────────

class SearchResults(BaseModel):
    tasks: List[TaskOut]
    habits: List[HabitOut]
    events: List[EventOut]
    users: List[PublicProfile]


# ─── Community / Groups ───────────────────────────────────────────────────────────

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    avatar_emoji: str = "💪"
    is_public: bool = True
    max_members: int = 50

class GroupOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    avatar_emoji: str
    is_public: bool
    max_members: int
    member_count: int = 0
    is_member: bool = False
    is_admin: bool = False
    created_at: datetime
    model_config = {"from_attributes": True}

class GroupMemberOut(BaseModel):
    user_id: int
    name: Optional[str]
    role: str
    streak: int = 0
    level: int = 1
    xp: int = 0
    joined_at: datetime
    model_config = {"from_attributes": True}

class GroupChallengeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_value: int
    target_unit: str = "completions"
    start_date: datetime
    end_date: datetime
    reward_coins: int = 50

class GroupChallengeOut(BaseModel):
    id: int
    group_id: int
    title: str
    description: Optional[str]
    target_value: int
    target_unit: str
    start_date: datetime
    end_date: datetime
    reward_coins: int
    is_active: bool
    participant_count: int = 0
    my_progress: int = 0
    my_completed: bool = False
    model_config = {"from_attributes": True}

class GroupChallengeProgressOut(BaseModel):
    challenge_id: int
    user_id: int
    current_value: int
    completed_at: Optional[datetime]
    model_config = {"from_attributes": True}

class GroupMessageCreate(BaseModel):
    content: str

class MessageReactionOut(BaseModel):
    emoji: str
    count: int
    reacted_by_me: bool

class GroupMessageOut(BaseModel):
    id: int
    group_id: int
    sender_id: int
    sender_name: Optional[str] = None
    content: str
    message_type: str
    created_at: datetime
    reactions: List[MessageReactionOut] = []
    model_config = {"from_attributes": True}

class GroupFeedItem(BaseModel):
    user_id: int
    user_name: str
    action: str
    detail: Optional[str]
    created_at: datetime

class GroupLeaderboardEntry(BaseModel):
    user_id: int
    name: str
    streak: int
    xp: int
    level: int
    completions_in_group: int
    rank: int
