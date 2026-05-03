"""
Celery Workers

Beat schedule:
  compute_behavior_scores        — hourly
  detect_task_skips              — nightly 23:55
  detect_inactive_users          — every 6 hours
  aggregate_weekly_analytics_all — weekly (Monday 00:05)
  send_streak_reminder           — daily 20:00
"""
from app.workers.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.models import Task, BehaviorScore, UserStats, TaskCompletion, TaskSkip, Streak, User
from app.services.ai_service import compute_task_behavior_score, compute_consistency_index
from app.services.analytics_service import aggregate_user_week, get_week_start
from app.services.notification_service import send_to_user, should_suppress
from app.core.cache import cache_delete_pattern
from app.core.events import emit, TASK_SKIPPED, USER_INACTIVE
from datetime import datetime, date, timedelta
from typing import Any, Dict
import logging

logger = logging.getLogger(__name__)


# ─── AI: Per-task behavior score (triggered on completion/skip) ───────────────

@celery_app.task(name="app.workers.tasks.compute_behavior_scores_for_task", bind=True, max_retries=3)
def compute_behavior_scores_for_task(self, user_id: int, task_id: int):
    """Triggered immediately after TASK_COMPLETED or TASK_SKIPPED events."""
    db = SessionLocal()
    try:
        scores = compute_task_behavior_score(user_id, task_id, db)
        if not scores:
            return

        existing = db.query(BehaviorScore).filter(
            BehaviorScore.user_id == user_id,
            BehaviorScore.task_id == task_id,
        ).first()

        if existing:
            for k, v in scores.items():
                setattr(existing, k, v)
            existing.computed_at = datetime.utcnow()
        else:
            db.add(BehaviorScore(user_id=user_id, task_id=task_id, **scores))

        ci = compute_consistency_index(user_id, db)
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        if stats:
            stats.consistency_index = ci

        db.commit()
        cache_delete_pattern(f"dashboard:{user_id}:*")
        return {"user_id": user_id, "task_id": task_id, "consistency_index": ci}

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


# ─── AI: Hourly full recompute for all active tasks ───────────────────────────

@celery_app.task(name="app.workers.tasks.compute_behavior_scores", bind=True, max_retries=3)
def compute_behavior_scores(self):
    """Runs hourly. Recomputes behavior scores for all active tasks."""
    db = SessionLocal()
    try:
        tasks = db.query(Task).filter(Task.is_active == True, Task.deleted_at == None).all()
        updated = 0

        for task in tasks:
            try:
                scores = compute_task_behavior_score(task.user_id, task.id, db)
                if not scores:
                    continue

                existing = db.query(BehaviorScore).filter(
                    BehaviorScore.user_id == task.user_id,
                    BehaviorScore.task_id == task.id,
                ).first()

                if existing:
                    for k, v in scores.items():
                        setattr(existing, k, v)
                    existing.computed_at = datetime.utcnow()
                else:
                    db.add(BehaviorScore(user_id=task.user_id, task_id=task.id, **scores))

                updated += 1
            except Exception as e:
                logger.error(f"Failed to compute score for task {task.id}: {e}")

        user_ids = list(set(t.user_id for t in tasks))
        for uid in user_ids:
            ci = compute_consistency_index(uid, db)
            stats = db.query(UserStats).filter(UserStats.user_id == uid).first()
            if stats:
                stats.consistency_index = ci
            cache_delete_pattern(f"dashboard:{uid}:*")

        db.commit()
        logger.info(f"Behavior scores updated: {updated} tasks, {len(user_ids)} users")
        return {"updated": updated, "users": len(user_ids)}

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


# ─── Skip Detection: nightly 23:55 ───────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.detect_task_skips", bind=True, max_retries=2)
def detect_task_skips(self):
    """
    Runs nightly at 23:55.
    For every active daily/weekly task, checks if it was completed today.
    If not → records a TaskSkip row and emits TASK_SKIPPED event.
    Idempotent: skips already recorded for today are ignored.
    """
    db = SessionLocal()
    try:
        today = date.today()
        skipped_count = 0

        daily_tasks = db.query(Task).filter(
            Task.is_active == True,
            Task.deleted_at == None,
            Task.schedule_type.in_(["daily", "weekly"]),
        ).all()

        for task in daily_tasks:
            # Check if already completed today
            completed_today = db.query(TaskCompletion).filter(
                TaskCompletion.task_id == task.id,
                TaskCompletion.user_id == task.user_id,
                TaskCompletion.completed_at >= datetime.combine(today, datetime.min.time()),
            ).first()

            if completed_today:
                continue

            # Check if skip already recorded today (idempotency)
            already_skipped = db.query(TaskSkip).filter(
                TaskSkip.task_id == task.id,
                TaskSkip.user_id == task.user_id,
                TaskSkip.skipped_date == today,
            ).first()

            if already_skipped:
                continue

            # Record skip
            db.add(TaskSkip(
                task_id=task.id,
                user_id=task.user_id,
                skipped_date=today,
            ))
            skipped_count += 1

            # Emit TASK_SKIPPED — fans out to AI engine + notification engine
            emit(TASK_SKIPPED, {
                "user_id":    task.user_id,
                "task_id":    task.id,
                "task_title": task.title,
                "skipped_date": str(today),
            })

        db.commit()
        logger.info(f"Skip detection: {skipped_count} skips recorded for {today}")
        return {"skipped": skipped_count, "date": str(today)}

    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=120)
    finally:
        db.close()


# ─── Inactive User Detection: every 6 hours ──────────────────────────────────

@celery_app.task(name="app.workers.tasks.detect_inactive_users", bind=True, max_retries=2)
def detect_inactive_users(self):
    """
    Runs every 6 hours.
    Finds users with no task completion in the last 48 hours.
    Emits USER_INACTIVE event → notification engine sends re-engagement push.
    """
    db = SessionLocal()
    try:
        threshold = datetime.utcnow() - timedelta(hours=48)
        inactive_count = 0

        # Get all active users
        users = db.query(User).filter(
            User.is_active == True,
            User.deleted_at == None,
        ).all()

        for user in users:
            last_completion = db.query(TaskCompletion).filter(
                TaskCompletion.user_id == user.id,
                TaskCompletion.completed_at >= threshold,
            ).first()

            if last_completion:
                continue  # Active — skip

            # Check they have at least one active task (don't spam new users)
            has_tasks = db.query(Task).filter(
                Task.user_id == user.id,
                Task.is_active == True,
                Task.deleted_at == None,
            ).first()

            if not has_tasks:
                continue

            hours_since = _hours_since_last_completion(user.id, db)
            emit(USER_INACTIVE, {
                "user_id":        user.id,
                "hours_inactive": hours_since,
            })
            inactive_count += 1

        logger.info(f"Inactive user detection: {inactive_count} users flagged")
        return {"inactive_users": inactive_count}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


def _hours_since_last_completion(user_id: int, db) -> int:
    last = db.query(TaskCompletion).filter(
        TaskCompletion.user_id == user_id,
    ).order_by(TaskCompletion.completed_at.desc()).first()

    if not last or not last.completed_at:
        return 999
    delta = datetime.utcnow() - last.completed_at
    return int(delta.total_seconds() / 3600)


# ─── Analytics: weekly aggregation for one user (on-demand) ──────────────────

@celery_app.task(name="app.workers.tasks.aggregate_weekly_analytics", bind=True, max_retries=2)
def aggregate_weekly_analytics(self, user_id: int):
    """
    Triggered by TASK_SKIPPED event handler and weekly beat.
    Aggregates current week stats for a single user.
    """
    db = SessionLocal()
    try:
        week_start = get_week_start(date.today())
        aggregate_user_week(user_id, week_start, db)
        db.commit()
        cache_delete_pattern(f"dashboard:{user_id}:*")
        return {"user_id": user_id, "week_start": str(week_start)}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()


# ─── Analytics: weekly aggregation for ALL users (Monday beat) ───────────────

@celery_app.task(name="app.workers.tasks.aggregate_weekly_analytics_all", bind=True, max_retries=2)
def aggregate_weekly_analytics_all(self):
    """Runs every Monday at 00:05. Aggregates last week for all users."""
    db = SessionLocal()
    try:
        last_week_start = get_week_start(date.today()) - timedelta(weeks=1)
        users = db.query(User).filter(
            User.is_active == True, User.deleted_at == None
        ).all()

        for user in users:
            try:
                aggregate_user_week(user.id, last_week_start, db)
            except Exception as e:
                logger.error(f"Weekly analytics failed for user {user.id}: {e}")

        db.commit()
        logger.info(f"Weekly analytics aggregated for {len(users)} users")
        return {"users": len(users), "week_start": str(last_week_start)}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


# ─── Notifications: streak reminder (daily 20:00) ────────────────────────────

@celery_app.task(name="app.workers.tasks.send_streak_reminder", bind=True, max_retries=2)
def send_streak_reminder(self):
    """
    Runs daily at 20:00 (default).
    Finds users whose streak is at risk (no completion today).
    Uses per-user avg_completion_hour from BehaviorScore for smart timing.
    """
    db = SessionLocal()
    try:
        today = date.today()
        at_risk = db.query(Streak).filter(
            Streak.current_streak > 0,
            Streak.last_completed_date < today,
        ).all()

        notified = 0
        for streak_row in at_risk:
            if should_suppress(streak_row.user_id, "streak_at_risk"):
                continue
            # Smart timing: only send if current hour is near user's best hour
            best_score = db.query(BehaviorScore).filter(
                BehaviorScore.user_id == streak_row.user_id,
                BehaviorScore.avg_completion_hour != None,
            ).order_by(BehaviorScore.computed_at.desc()).first()
            if best_score and best_score.avg_completion_hour is not None:
                best_hour = int(best_score.avg_completion_hour)
                current_hour = datetime.utcnow().hour
                # Only send within 2 hours of user's peak completion window
                if abs(current_hour - best_hour) > 2:
                    continue
            send_to_user(
                user_id=streak_row.user_id,
                notification_type="streak_at_risk",
                data={"streak": streak_row.current_streak},
            )
            notified += 1

        return {"at_risk_users": notified}
    finally:
        db.close()


# ─── Notifications: push notification dispatcher ─────────────────────────────

@celery_app.task(name="app.workers.tasks.send_push_notification", bind=True, max_retries=3)
def send_push_notification(self, user_id: int, notification_type: str, data: Dict[str, Any]):
    """
    Generic push notification dispatcher.
    Called by event handlers in events.py.
    Phase 2: replace send_to_user stub with real FCM call.
    """
    try:
        if should_suppress(user_id, notification_type):
            return {"suppressed": True}
        sent = send_to_user(user_id, notification_type, data)
        return {"sent": sent, "user_id": user_id, "type": notification_type}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


# ─── Weekly report: Sunday 09:00 ─────────────────────────────────────────────

@celery_app.task(name="app.workers.tasks.generate_weekly_reports", bind=True, max_retries=2)
def generate_weekly_reports(self):
    """Runs every Sunday at 09:00. Sends weekly AI insight push to all active users."""
    db = SessionLocal()
    try:
        from app.services.ai_service import get_best_completion_hour
        from app.services.analytics_service import get_week_start
        from app.models.models import WeeklyAnalytics
        from datetime import date, timedelta

        last_week = get_week_start(date.today()) - timedelta(weeks=1)
        users = db.query(User).filter(User.is_active == True, User.deleted_at == None).all()
        sent = 0

        for user in users:
            record = db.query(WeeklyAnalytics).filter(
                WeeklyAnalytics.user_id == user.id,
                WeeklyAnalytics.week_start == last_week,
            ).first()
            if not record:
                continue
            best_hour = get_best_completion_hour(user.id, db)
            period = "morning" if (best_hour or 9) < 12 else "afternoon" if (best_hour or 14) < 17 else "evening"
            tip = f"Schedule tasks in the {period} for best results."
            send_to_user(
                user_id=user.id,
                notification_type="weekly_report",
                data={"completions": record.completions, "xp_earned": record.xp_earned, "tip": tip},
            )
            sent += 1

        logger.info(f"Weekly reports sent to {sent} users")
        return {"sent": sent}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


# ─── Consistency snapshot: daily midnight ─────────────────────────────────────

@celery_app.task(name="app.workers.tasks.snapshot_consistency_scores", bind=True, max_retries=2)
def snapshot_consistency_scores(self):
    """Runs daily at midnight. Saves each user's current CI score for history graph."""
    db = SessionLocal()
    try:
        from app.services.ai_service import compute_consistency_index
        from app.models.models import ConsistencySnapshot
        from datetime import date
        today = date.today()
        users = db.query(User).filter(User.is_active == True, User.deleted_at == None).all()
        saved = 0
        for user in users:
            existing = db.query(ConsistencySnapshot).filter(
                ConsistencySnapshot.user_id == user.id,
                ConsistencySnapshot.snapped_at == today,
            ).first()
            if existing:
                continue
            ci = compute_consistency_index(user.id, db)
            db.add(ConsistencySnapshot(user_id=user.id, score=ci, snapped_at=today))
            saved += 1
        db.commit()
        logger.info(f"CI snapshots saved: {saved}")
        return {"saved": saved}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()


# ─── XP multiplier windows: daily scheduler ───────────────────────────────────

@celery_app.task(name="app.workers.tasks.schedule_xp_windows", bind=True, max_retries=2)
def schedule_xp_windows(self):
    """Runs daily. Creates 2x XP windows at each user's lowest-activity hour."""
    db = SessionLocal()
    try:
        from app.models.models import XPMultiplierWindow, TaskCompletion, ConsistencySnapshot
        from sqlalchemy import extract, func
        from datetime import datetime, timedelta

        users = db.query(User).filter(User.is_active == True, User.deleted_at == None).all()
        created = 0
        now = datetime.utcnow()

        for user in users:
            result = db.query(
                extract("hour", TaskCompletion.completed_at).label("hour"),
                func.count().label("cnt")
            ).filter(
                TaskCompletion.user_id == user.id,
                TaskCompletion.completed_at >= now - timedelta(days=30),
            ).group_by("hour").order_by(func.count().asc()).first()

            target_hour = int(result.hour) if result else 19
            window_start = now.replace(hour=target_hour, minute=0, second=0, microsecond=0)
            if window_start < now:
                window_start += timedelta(days=1)
            window_end = window_start + timedelta(hours=2)

            existing = db.query(XPMultiplierWindow).filter(
                XPMultiplierWindow.user_id == user.id,
                XPMultiplierWindow.starts_at >= now.replace(hour=0, minute=0, second=0),
            ).first()
            if existing:
                continue

            db.add(XPMultiplierWindow(
                user_id=user.id, multiplier=2.0,
                starts_at=window_start, ends_at=window_end,
            ))
            created += 1

        db.commit()
        logger.info(f"XP multiplier windows created: {created}")
        return {"created": created}
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc, countdown=300)
    finally:
        db.close()
