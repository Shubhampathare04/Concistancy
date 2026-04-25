from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, Time, func
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    goal = Column(Text)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime, server_default=func.now())

class Task(Base):
    __tablename__ = "tasks"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    title = Column(String(255))
    description = Column(Text)
    difficulty = Column(Integer, default=1)
    estimated_minutes = Column(Integer)
    schedule_type = Column(Enum("one_time", "daily", "weekly"), default="daily")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class TaskSchedule(Base):
    __tablename__ = "task_schedules"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"))
    day_of_week = Column(Integer)
    time_of_day = Column(Time)

class TaskCompletion(Base):
    __tablename__ = "task_completions"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    task_id = Column(BigInteger, ForeignKey("tasks.id"))
    user_id = Column(BigInteger, ForeignKey("users.id"))
    completed_at = Column(DateTime, server_default=func.now())
    duration_minutes = Column(Integer)
    proof_url = Column(Text)
    status = Column(Enum("pending", "verified", "rejected"), default="pending")

class Streak(Base):
    __tablename__ = "streaks"
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_completed_date = Column(Date)

class UserStats(Base):
    __tablename__ = "user_stats"
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    coins = Column(Integer, default=0)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    action_type = Column(String(100))
    meta = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
