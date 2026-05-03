"""
Rank & Coin Tier Engine
─────────────────────────────────────────────────────────────────────────────
Coin tiers:   Bronze → Silver → Gold → Diamond → Legend
Rank titles:  Beginner → Apprentice → Consistent → Dedicated →
              Expert → Master → Legend → Mythic

Badges are earned once and never lost.
"""
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import UserStats, Streak, TaskCompletion
from app.schemas.schemas import CoinTier, RankOut
from datetime import datetime, timedelta

# ── Coin Tiers ────────────────────────────────────────────────────────────────

COIN_TIERS = [
    {"tier": "bronze",  "label": "Bronze",  "min": 0,    "max": 99,   "color": "#cd7f32", "icon": "shield-outline"},
    {"tier": "silver",  "label": "Silver",  "min": 100,  "max": 499,  "color": "#c0c0c0", "icon": "shield-half"},
    {"tier": "gold",    "label": "Gold",    "min": 500,  "max": 1999, "color": "#fbbf24", "icon": "shield"},
    {"tier": "diamond", "label": "Diamond", "min": 2000, "max": 9999, "color": "#60a5fa", "icon": "diamond"},
    {"tier": "legend",  "label": "Legend",  "min": 10000,"max": None, "color": "#a78bfa", "icon": "star"},
]

RANK_TITLES = [
    "Beginner", "Apprentice", "Consistent", "Dedicated",
    "Expert", "Master", "Legend", "Mythic",
]

# ── Badge definitions ─────────────────────────────────────────────────────────

BADGE_RULES = [
    {"key": "first_task",      "label": "First Step",      "check": lambda s, st, ci, c: s.total_completions >= 1},
    {"key": "streak_3",        "label": "3-Day Streak",    "check": lambda s, st, ci, c: st >= 3},
    {"key": "streak_7",        "label": "Week Warrior",    "check": lambda s, st, ci, c: st >= 7},
    {"key": "streak_14",       "label": "Fortnight Force", "check": lambda s, st, ci, c: st >= 14},
    {"key": "streak_30",       "label": "Monthly Master",  "check": lambda s, st, ci, c: st >= 30},
    {"key": "level_5",         "label": "Level 5",         "check": lambda s, st, ci, c: s.level >= 5},
    {"key": "level_10",        "label": "Level 10",        "check": lambda s, st, ci, c: s.level >= 10},
    {"key": "xp_500",          "label": "500 XP Club",     "check": lambda s, st, ci, c: s.xp >= 500},
    {"key": "xp_1000",         "label": "1K XP Elite",     "check": lambda s, st, ci, c: s.xp >= 1000},
    {"key": "ci_80",           "label": "Consistency Pro", "check": lambda s, st, ci, c: ci >= 80},
    {"key": "silver_coins",    "label": "Silver Earner",   "check": lambda s, st, ci, c: c >= 100},
    {"key": "gold_coins",      "label": "Gold Collector",  "check": lambda s, st, ci, c: c >= 500},
    {"key": "diamond_coins",   "label": "Diamond Holder",  "check": lambda s, st, ci, c: c >= 2000},
]


def get_coin_tier(coins: int) -> CoinTier:
    current = COIN_TIERS[0]
    for tier in COIN_TIERS:
        if coins >= tier["min"]:
            current = tier

    # Find next tier
    idx = COIN_TIERS.index(current)
    next_tier_data = COIN_TIERS[idx + 1] if idx + 1 < len(COIN_TIERS) else None

    return CoinTier(
        tier=current["tier"],
        label=current["label"],
        coins=coins,
        next_tier=next_tier_data["tier"] if next_tier_data else None,
        coins_to_next=(next_tier_data["min"] - coins) if next_tier_data else None,
        color=current["color"],
        icon=current["icon"],
    )


def get_rank_title(level: int) -> str:
    idx = min(level - 1, len(RANK_TITLES) - 1)
    return RANK_TITLES[max(idx, 0)]


def get_earned_badges(
    stats: UserStats,
    streak: int,
    ci: float,
    coins: int,
) -> List[str]:
    earned = []
    for badge in BADGE_RULES:
        try:
            if badge["check"](stats, streak, ci, coins):
                earned.append(badge["key"])
        except Exception:
            pass
    return earned


def get_rank(user_id: int, db: Session) -> RankOut:
    stats  = db.query(UserStats).filter(UserStats.user_id == user_id).first()
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()

    xp     = stats.xp if stats else 0
    level  = stats.level if stats else 1
    coins  = stats.coins if stats else 0
    ci     = stats.consistency_index if stats else 0.0
    cur_streak = streak.current_streak if streak else 0

    coin_tier   = get_coin_tier(coins)
    rank_title  = get_rank_title(level)
    badges      = get_earned_badges(stats or UserStats(), cur_streak, ci, coins)

    return RankOut(
        rank_title=rank_title,
        rank_tier=coin_tier.tier,
        level=level,
        xp=xp,
        coins=coins,
        streak=cur_streak,
        consistency_index=ci,
        coin_tier=coin_tier,
        badges=badges,
    )
