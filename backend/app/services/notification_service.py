"""
Notification Engine
─────────────────────────────────────────────────────────────────────────────
Decides what to send, to whom, and when.
- No emojis in templates (push renderers handle that)
- Redis dedup: each (user, type, date) key suppresses duplicates for 24h
- FCM stub ready for Phase 2 wiring

Called by Celery tasks dispatched from events.py.
"""
from typing import Dict, Any, Optional
from datetime import date
import logging

logger = logging.getLogger(__name__)

# ── Notification Templates (no emojis — clean text only) ─────────────────────

_TEMPLATES: Dict[str, Dict[str, str]] = {
    "level_up": {
        "title": "Level Up!",
        "body":  "You reached Level {new_level}. Keep pushing.",
    },
    "task_skipped": {
        "title": "Don't break the chain",
        "body":  '"{task_title}" was skipped today. Complete it tomorrow to stay consistent.',
    },
    "user_inactive": {
        "title": "Time to get back on track",
        "body":  "You haven't completed a task in {hours_inactive} hours. One task is all it takes.",
    },
    "streak_at_risk": {
        "title": "Streak at risk",
        "body":  "Your {streak}-day streak ends tonight. Complete one task to keep it alive.",
    },
    "consistency_milestone": {
        "title": "Consistency milestone",
        "body":  "Your consistency score hit {score}/100. You're in the top tier.",
    },
    "coin_tier_up": {
        "title": "Coin tier upgrade",
        "body":  "You've reached {tier} tier with {coins} coins. Keep earning.",
    },
    "badge_earned": {
        "title": "Badge earned",
        "body":  'You unlocked the "{badge_label}" badge.',
    },
    "weekly_report": {
        "title": "Your weekly report is ready",
        "body":  "{completions} tasks completed, {xp_earned} XP earned. Tip: {tip}",
    },
}

# ── Dedup TTLs (seconds) ──────────────────────────────────────────────────────

_DEDUP_TTL: Dict[str, int] = {
    "task_skipped":          86400,   # once per day
    "user_inactive":         86400,   # once per day
    "streak_at_risk":        86400,   # once per day
    "level_up":              0,       # never suppress
    "consistency_milestone": 0,       # never suppress
    "coin_tier_up":          0,       # never suppress
    "badge_earned":          0,       # never suppress
    "weekly_report":         604800,  # once per week
}


def build_notification(notification_type: str, data: Dict[str, Any]) -> Optional[Dict[str, str]]:
    template = _TEMPLATES.get(notification_type)
    if not template:
        logger.warning(f"[Notify] Unknown notification type: {notification_type}")
        return None
    try:
        return {
            "title": template["title"].format(**data),
            "body":  template["body"].format(**data),
        }
    except KeyError as e:
        logger.error(f"[Notify] Missing template key {e} for type {notification_type}")
        return None


def should_suppress(user_id: int, notification_type: str) -> bool:
    """
    Redis-based dedup: returns True if this notification was already sent today.
    Falls back to False (allow) if Redis is unavailable.
    """
    ttl = _DEDUP_TTL.get(notification_type, 86400)
    if ttl == 0:
        return False  # never suppress this type

    try:
        from app.core.cache import get_redis
        r = get_redis()
        key = f"notif_sent:{user_id}:{notification_type}:{date.today()}"
        return r.exists(key) == 1
    except Exception:
        return False  # Redis down → allow send


def _mark_sent(user_id: int, notification_type: str) -> None:
    ttl = _DEDUP_TTL.get(notification_type, 86400)
    if ttl == 0:
        return
    try:
        from app.core.cache import get_redis
        r = get_redis()
        key = f"notif_sent:{user_id}:{notification_type}:{date.today()}"
        r.setex(key, ttl, "1")
    except Exception:
        pass


def send_to_user(user_id: int, notification_type: str, data: Dict[str, Any]) -> bool:
    """
    Sends a push notification to a user.

    Phase 1: logs the notification (FCM not yet integrated).
    Phase 2: look up user's FCM token from DB, call Firebase Admin SDK.

    Returns True if sent, False if suppressed or failed.
    """
    notification = build_notification(notification_type, data)
    if not notification:
        return False

    # ── Phase 2: replace this block with FCM send ──────────────────────────
    # from firebase_admin import messaging
    # token = _get_user_fcm_token(user_id)
    # if not token:
    #     logger.warning(f"[Notify] No FCM token for user {user_id}")
    #     return False
    # message = messaging.Message(
    #     notification=messaging.Notification(
    #         title=notification["title"],
    #         body=notification["body"],
    #     ),
    #     token=token,
    #     data={k: str(v) for k, v in data.items()},
    # )
    # messaging.send(message)
    # ───────────────────────────────────────────────────────────────────────

    logger.info(
        f"[Notify] user={user_id} type={notification_type} "
        f"title='{notification['title']}'"
    )
    _mark_sent(user_id, notification_type)
    return True
