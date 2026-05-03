from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "consistency",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.workers.tasks.compute_behavior_scores":          {"queue": "ai"},
        "app.workers.tasks.compute_behavior_scores_for_task": {"queue": "ai"},
        "app.workers.tasks.detect_task_skips":                {"queue": "ai"},
        "app.workers.tasks.detect_inactive_users":            {"queue": "ai"},
        "app.workers.tasks.aggregate_weekly_analytics":       {"queue": "analytics"},
        "app.workers.tasks.aggregate_weekly_analytics_all":   {"queue": "analytics"},
        "app.workers.tasks.send_streak_reminder":             {"queue": "notifications"},
        "app.workers.tasks.send_push_notification":           {"queue": "notifications"},
    },
    beat_schedule={
        # AI — hourly full recompute
        "compute-behavior-scores-hourly": {
            "task":     "app.workers.tasks.compute_behavior_scores",
            "schedule": 3600.0,
        },
        # Skip detection — nightly 23:55 UTC
        "detect-task-skips-nightly": {
            "task":     "app.workers.tasks.detect_task_skips",
            "schedule": crontab(hour=23, minute=55),
        },
        # Inactive user detection — every 6 hours
        "detect-inactive-users": {
            "task":     "app.workers.tasks.detect_inactive_users",
            "schedule": crontab(minute=0, hour="*/6"),
        },
        # Weekly analytics — every Monday 00:05 UTC
        "aggregate-weekly-analytics-monday": {
            "task":     "app.workers.tasks.aggregate_weekly_analytics_all",
            "schedule": crontab(hour=0, minute=5, day_of_week="monday"),
        },
        # Streak reminders — daily 20:00 UTC
        "send-streak-reminders-daily": {
            "task":     "app.workers.tasks.send_streak_reminder",
            "schedule": crontab(hour=20, minute=0),
        },
    },
)
