from sqlalchemy import (
    BigInteger, Boolean, Column, Date, DateTime, Enum,
    Float, ForeignKey, Index, Integer, JSON, String, Text, Time, func
)
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    goal = Column(Text)
    timezone = Column(String(50), default="UTC")
    is_active = Column(Boolean, default=True)
    is_onboarded = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)  # Email verification
    verification_token = Column(String(255), nullable=True)  # Email verification token
    failed_login_attempts = Column(Integer, default=0)  # Account lockout
    locked_until = Column(DateTime, nullable=True)  # Account lockout expiry
    banned_at = Column(DateTime, nullable=True)
    ban_reason = Column(Text, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Task(Base):
    __tablename__ = "tasks"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    difficulty = Column(Integer, default=1)
    estimated_minutes = Column(Integer)
    schedule_type = Column(Enum("one_time", "daily", "weekly"), default="daily")
    is_active = Column(Boolean, default=True)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    target = Column(Integer, nullable=True)        # e.g. 10000 steps, 8 glasses
    sensor_type = Column(String(20), nullable=True) # steps | timer | reps | water | none

    __table_args__ = (
        Index("idx_tasks_user_active", "user_id", "is_active"),
    )


class TaskSchedule(Base):
    __tablename__ = "task_schedules"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), index=True)
    day_of_week = Column(Integer)
    time_of_day = Column(Time)


class TaskCompletion(Base):
    __tablename__ = "task_completions"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    completed_at = Column(DateTime, server_default=func.now())
    duration_minutes = Column(Integer)
    proof_url = Column(Text)
    status = Column(Enum("pending", "verified", "rejected"), default="pending")
    idempotency_key = Column(String(64), unique=True, nullable=True)

    __table_args__ = (
        Index("idx_completions_user_date", "user_id", "completed_at"),
        Index("idx_completions_task_user", "task_id", "user_id"),
    )


class Streak(Base):
    __tablename__ = "streaks"
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(Date)
    freeze_count = Column(Integer, default=0)
    streak_shields = Column(Integer, default=0)
    recovery_expires_at = Column(DateTime, nullable=True)


class UserStats(Base):
    __tablename__ = "user_stats"
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    coins = Column(Integer, default=0)
    consistency_index = Column(Float, default=0.0)
    total_completions = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class BehaviorScore(Base):
    """Stores computed AI behavior scores per user per task — updated by Celery worker."""
    __tablename__ = "behavior_scores"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), index=True)
    success_rate = Column(Float, default=0.0)
    avg_completion_hour = Column(Float, nullable=True)
    avg_duration_minutes = Column(Float, nullable=True)
    predicted_success_prob = Column(Float, default=0.5)
    recommended_difficulty = Column(Integer, default=1)
    computed_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_behavior_user_task", "user_id", "task_id"),
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    action_type = Column(String(100), index=True)
    meta = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_activity_user_type", "user_id", "action_type"),
        Index("idx_activity_user_time", "user_id", "created_at"),
    )


class FCMToken(Base):
    """Stores device FCM tokens for push notifications."""
    __tablename__ = "fcm_tokens"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(512), nullable=False, unique=True)
    platform = Column(String(20), default="expo")  # expo | ios | android
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Habit(Base):
    __tablename__ = "habits"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(Enum("health", "fitness", "mental", "diet", "other"), default="other")
    frequency = Column(Enum("daily", "weekly"), default="daily")
    reminder_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class HabitLog(Base):
    __tablename__ = "habit_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    habit_id = Column(BigInteger, ForeignKey("habits.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    logged_at = Column(DateTime, server_default=func.now())
    note = Column(Text, nullable=True)


class Event(Base):
    __tablename__ = "events"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(Enum("challenge", "event"), default="challenge")
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reward_coins = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class EventParticipant(Base):
    __tablename__ = "event_participants"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("events.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    joined_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    rank = Column(Integer, nullable=True)

    __table_args__ = (
        Index("idx_event_participant", "event_id", "user_id"),
    )


class Follow(Base):
    __tablename__ = "follows"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    follower_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    following_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_follow_pair", "follower_id", "following_id"),
    )


class Message(Base):
    __tablename__ = "messages"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    room_id = Column(String(100), nullable=False, index=True)  # "user_{a}_{b}" sorted
    sender_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    read_at = Column(DateTime, nullable=True)


class Professional(Base):
    __tablename__ = "professionals"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True)
    specialty = Column(String(100), nullable=False)
    bio = Column(Text)
    hourly_rate = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    professional_id = Column(BigInteger, ForeignKey("professionals.id"), index=True)
    client_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(Enum("pending", "confirmed", "completed", "cancelled"), default="pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, unique=True)
    plan = Column(Enum("free", "pro", "elite"), default="free")
    status = Column(Enum("active", "expired", "cancelled"), default="active")
    expires_at = Column(DateTime, nullable=True)
    streak_freeze_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SyncQueue(Base):
    """Server-side sync queue for conflict resolution."""
    __tablename__ = "sync_queue"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    action_type = Column(String(100))
    payload = Column(JSON)
    idempotency_key = Column(String(64), unique=True)
    status = Column(Enum("pending", "processed", "failed"), default="pending")
    retry_count = Column(Integer, default=0)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_sync_user_status", "user_id", "status"),
    )


class TaskSkip(Base):
    """
    Records when a daily/weekly task was NOT completed on its scheduled day.
    Populated by detect_task_skips Celery worker (runs nightly at 23:55).
    Used by AI engine to compute fail_rate and adjust difficulty.
    """
    __tablename__ = "task_skips"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    skipped_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_skips_user_date", "user_id", "skipped_date"),
        Index("idx_skips_task_user", "task_id", "user_id"),
    )


class MoodLog(Base):
    __tablename__ = "mood_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), nullable=True)
    mood = Column(Integer, nullable=False)    # 1-5
    energy = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (Index("idx_mood_user_time", "user_id", "created_at"),)


class PersonalRecord(Base):
    __tablename__ = "personal_records"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), nullable=True)
    record_type = Column(String(50), nullable=False)  # fastest_completion | longest_task_streak | most_completions_week
    value = Column(Float, nullable=False)
    achieved_at = Column(DateTime, server_default=func.now())
    __table_args__ = (Index("idx_pr_user_task_type", "user_id", "task_id", "record_type"),)


class ConsistencySnapshot(Base):
    __tablename__ = "consistency_snapshots"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    score = Column(Float, nullable=False)
    snapped_at = Column(Date, nullable=False)
    __table_args__ = (Index("idx_snapshot_user_date", "user_id", "snapped_at"),)


class HabitStreak(Base):
    __tablename__ = "habit_streaks"
    habit_id = Column(BigInteger, ForeignKey("habits.id"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_logged_date = Column(Date, nullable=True)


class Rival(Base):
    __tablename__ = "rivals"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    challenger_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    rival_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (Index("idx_rival_pair", "challenger_id", "rival_id"),)


class XPMultiplierWindow(Base):
    __tablename__ = "xp_multiplier_windows"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    multiplier = Column(Float, default=2.0)
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class TaskReminder(Base):
    __tablename__ = "task_reminders"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    remind_at = Column(Time, nullable=False)
    days_of_week = Column(JSON, default=list)  # [0,1,2,3,4,5,6] = all days
    is_active = Column(Boolean, default=True)


class Group(Base):
    __tablename__ = "groups"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    avatar_emoji = Column(String(10), default="💪")
    created_by = Column(BigInteger, ForeignKey("users.id"), index=True)
    is_public = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    created_at = Column(DateTime, server_default=func.now())


class GroupMember(Base):
    __tablename__ = "group_members"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("groups.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    role = Column(Enum("admin", "member"), default="member")
    joined_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)
    __table_args__ = (Index("idx_group_member", "group_id", "user_id"),)


class GroupChallenge(Base):
    __tablename__ = "group_challenges"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("groups.id"), index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    target_value = Column(Integer, nullable=False)
    target_unit = Column(String(50), default="completions")  # steps|minutes|reps|glasses|completions
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    reward_coins = Column(Integer, default=50)
    created_by = Column(BigInteger, ForeignKey("users.id"), index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class GroupChallengeProgress(Base):
    __tablename__ = "group_challenge_progress"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    challenge_id = Column(BigInteger, ForeignKey("group_challenges.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    current_value = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    __table_args__ = (Index("idx_challenge_progress", "challenge_id", "user_id"),)


class GroupMessage(Base):
    __tablename__ = "group_messages"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    group_id = Column(BigInteger, ForeignKey("groups.id"), index=True)
    sender_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)
    message_type = Column(Enum("text", "system", "achievement"), default="text")
    created_at = Column(DateTime, server_default=func.now())
    edited_at = Column(DateTime, nullable=True)
    __table_args__ = (Index("idx_group_msg", "group_id", "created_at"),)


class MessageReaction(Base):
    __tablename__ = "message_reactions"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    message_id = Column(BigInteger, ForeignKey("group_messages.id"), index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    emoji = Column(String(10), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    __table_args__ = (Index("idx_reaction_msg_user", "message_id", "user_id"),)


class WeeklyAnalytics(Base):
    """
    Pre-aggregated weekly stats per user — written by analytics_engine Celery worker.
    Powers the Stats screen without live aggregation queries.
    """
    __tablename__ = "weekly_analytics"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), index=True)
    week_start = Column(Date, nullable=False)  # Monday of the week
    completions = Column(Integer, default=0)
    skips = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    avg_difficulty = Column(Float, default=0.0)
    xp_earned = Column(Integer, default=0)
    consistency_index_snapshot = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_weekly_user_week", "user_id", "week_start"),
    )


class AdminUser(Base):
    __tablename__ = "admin_users"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    role = Column(Enum("super_admin", "admin", "analyst"), default="analyst", nullable=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(BigInteger, ForeignKey("admin_users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(BigInteger, nullable=True)
    meta_data = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("idx_audit_entity", "entity_type", "entity_id"),
        Index("idx_audit_created", "created_at"),
    )


class Payment(Base):
    __tablename__ = "payments"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    subscription_id = Column(BigInteger, ForeignKey("subscriptions.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(Enum("pending", "completed", "failed", "refunded"), default="pending")
    provider = Column(String(50), nullable=False)
    provider_transaction_id = Column(String(255))
    meta_data = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_payment_status", "status"),
        Index("idx_payment_created", "created_at"),
    )
