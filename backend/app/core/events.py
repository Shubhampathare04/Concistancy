"""
Event Bus — decouples action triggers from side effects.

Events flow:
  task_service / Celery workers  →  emit(EVENT, payload)
                                         ↓
                              ┌──────────┼──────────┐
                         AI Engine  Analytics  Notification Engine

All handlers are registered at import time via @on(EVENT).
Handlers that need DB access receive a db session in the payload.
Handlers that are async-heavy dispatch Celery tasks instead of doing work inline.

Event constants (use these — never raw strings):
  TASK_CREATED   TASK_COMPLETED   TASK_SKIPPED   USER_INACTIVE
"""
from typing import Callable, Dict, List, Any
import logging

logger = logging.getLogger(__name__)

# ─── Event Constants ──────────────────────────────────────────────────────────

TASK_CREATED   = "TASK_CREATED"
TASK_COMPLETED = "TASK_COMPLETED"
TASK_SKIPPED   = "TASK_SKIPPED"
USER_INACTIVE  = "USER_INACTIVE"

# ─── Handler Registry ─────────────────────────────────────────────────────────

_handlers: Dict[str, List[Callable]] = {}


def on(event: str) -> Callable:
    """Decorator — registers a handler for an event."""
    def decorator(fn: Callable) -> Callable:
        _handlers.setdefault(event, []).append(fn)
        return fn
    return decorator


def emit(event: str, payload: Dict[str, Any]) -> None:
    """
    Fire event synchronously. Handlers should be fast — heavy work
    must be dispatched to Celery inside the handler, not done inline.
    """
    for handler in _handlers.get(event, []):
        try:
            handler(payload)
        except Exception as e:
            logger.error(f"[EventBus] Handler failed [{event}] {handler.__name__}: {e}")


# ─── AI Engine Handlers ───────────────────────────────────────────────────────

@on(TASK_COMPLETED)
def _ai_on_task_completed(payload: Dict[str, Any]) -> None:
    """Trigger per-task behavior score recompute after every completion."""
    try:
        from app.workers.tasks import compute_behavior_scores_for_task
        compute_behavior_scores_for_task.delay(
            payload["user_id"],
            payload["task_id"],
        )
    except Exception as e:
        logger.error(f"[AI] Failed to dispatch behavior score task: {e}")


@on(TASK_SKIPPED)
def _ai_on_task_skipped(payload: Dict[str, Any]) -> None:
    """Recompute behavior score when a skip is recorded — skip degrades success_rate."""
    try:
        from app.workers.tasks import compute_behavior_scores_for_task
        compute_behavior_scores_for_task.delay(
            payload["user_id"],
            payload["task_id"],
        )
    except Exception as e:
        logger.error(f"[AI] Failed to dispatch behavior score on skip: {e}")


# ─── Analytics Engine Handlers ────────────────────────────────────────────────

@on(TASK_COMPLETED)
def _analytics_on_task_completed(payload: Dict[str, Any]) -> None:
    """Log completion event to activity_logs via the db session in payload."""
    db = payload.get("db")
    if not db:
        return
    try:
        from app.models.models import ActivityLog
        db.add(ActivityLog(
            user_id=payload["user_id"],
            action_type=TASK_COMPLETED,
            meta={
                "task_id":          payload["task_id"],
                "xp_gained":        payload.get("xp_gained", 0),
                "streak":           payload.get("streak", 0),
                "consistency_index": payload.get("consistency_index", 0.0),
                "duration_minutes": payload.get("duration_minutes"),
                "level_up":         payload.get("level_up", False),
            },
        ))
        # db.commit() is called by the caller (task_service) after emit()
    except Exception as e:
        logger.error(f"[Analytics] Failed to log TASK_COMPLETED: {e}")


@on(TASK_CREATED)
def _analytics_on_task_created(payload: Dict[str, Any]) -> None:
    db = payload.get("db")
    if not db:
        return
    try:
        from app.models.models import ActivityLog
        db.add(ActivityLog(
            user_id=payload["user_id"],
            action_type=TASK_CREATED,
            meta={
                "task_id":   payload["task_id"],
                "title":     payload.get("title", ""),
                "difficulty": payload.get("difficulty", 1),
            },
        ))
    except Exception as e:
        logger.error(f"[Analytics] Failed to log TASK_CREATED: {e}")


@on(TASK_SKIPPED)
def _analytics_on_task_skipped(payload: Dict[str, Any]) -> None:
    """Dispatch weekly analytics aggregation after a skip is recorded."""
    try:
        from app.workers.tasks import aggregate_weekly_analytics
        aggregate_weekly_analytics.delay(payload["user_id"])
    except Exception as e:
        logger.error(f"[Analytics] Failed to dispatch weekly aggregation on skip: {e}")


@on(USER_INACTIVE)
def _analytics_on_user_inactive(payload: Dict[str, Any]) -> None:
    try:
        from app.models.models import ActivityLog
        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            db.add(ActivityLog(
                user_id=payload["user_id"],
                action_type=USER_INACTIVE,
                meta={"hours_inactive": payload.get("hours_inactive", 48)},
            ))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"[Analytics] Failed to log USER_INACTIVE: {e}")


# ─── Notification Engine Handlers ─────────────────────────────────────────────

@on(TASK_COMPLETED)
def _notify_on_level_up(payload: Dict[str, Any]) -> None:
    """Queue a level-up push notification if the completion triggered a level up."""
    if not payload.get("level_up"):
        return
    try:
        from app.workers.tasks import send_push_notification
        send_push_notification.delay(
            user_id=payload["user_id"],
            notification_type="level_up",
            data={"new_level": payload.get("new_level", 1)},
        )
    except Exception as e:
        logger.error(f"[Notify] Failed to dispatch level_up notification: {e}")


@on(TASK_COMPLETED)
def _notify_on_coin_tier_up(payload: Dict[str, Any]) -> None:
    """Queue coin tier upgrade notification."""
    if not payload.get("coin_tier_up"):
        return
    try:
        from app.workers.tasks import send_push_notification
        send_push_notification.delay(
            user_id=payload["user_id"],
            notification_type="coin_tier_up",
            data={"tier": payload.get("new_tier", ""), "coins": payload.get("new_coins", 0)},
        )
    except Exception as e:
        logger.error(f"[Notify] Failed to dispatch coin_tier_up notification: {e}")


@on(TASK_COMPLETED)
def _notify_on_badge_earned(payload: Dict[str, Any]) -> None:
    """Queue badge earned notification for each newly unlocked badge."""
    badge_keys = payload.get("new_badge_keys", [])
    if not badge_keys:
        return
    try:
        from app.workers.tasks import send_push_notification
        from app.services.rank_service import BADGE_RULES
        badge_map = {b["key"]: b["label"] for b in BADGE_RULES}
        for key in badge_keys:
            send_push_notification.delay(
                user_id=payload["user_id"],
                notification_type="badge_earned",
                data={"badge_label": badge_map.get(key, key)},
            )
    except Exception as e:
        logger.error(f"[Notify] Failed to dispatch badge_earned notification: {e}")


@on(TASK_SKIPPED)
def _notify_on_task_skipped(payload: Dict[str, Any]) -> None:
    """Queue a gentle nudge notification when a task is skipped."""
    try:
        from app.workers.tasks import send_push_notification
        send_push_notification.delay(
            user_id=payload["user_id"],
            notification_type="task_skipped",
            data={
                "task_id":    payload["task_id"],
                "task_title": payload.get("task_title", ""),
            },
        )
    except Exception as e:
        logger.error(f"[Notify] Failed to dispatch task_skipped notification: {e}")


@on(USER_INACTIVE)
def _notify_on_user_inactive(payload: Dict[str, Any]) -> None:
    """Queue a re-engagement notification for inactive users."""
    try:
        from app.workers.tasks import send_push_notification
        send_push_notification.delay(
            user_id=payload["user_id"],
            notification_type="user_inactive",
            data={"hours_inactive": payload.get("hours_inactive", 48)},
        )
    except Exception as e:
        logger.error(f"[Notify] Failed to dispatch user_inactive notification: {e}")
