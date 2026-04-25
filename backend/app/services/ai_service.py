from datetime import date
from typing import Optional

def adjust_difficulty(success_rate: float, avg_time: float, expected_time: float) -> int:
    score = 3  # baseline
    score += 1 if success_rate > 0.8 else (-1 if success_rate < 0.4 else 0)
    score += 1 if avg_time < expected_time else -1
    return max(1, min(5, score))

def calculate_xp(difficulty: int, consistency_bonus: int = 0) -> int:
    return difficulty * 10 + consistency_bonus

def update_streak(last_date: Optional[date], today: date) -> str:
    if last_date is None:
        return "increment"
    delta = (today - last_date).days
    if delta == 1:
        return "increment"
    elif delta == 0:
        return "no_change"
    return "reset"

def get_suggestions(fail_rate: float, best_hour: Optional[int]) -> list[str]:
    suggestions = []
    if fail_rate > 0.5:
        suggestions.append("Consider reducing task difficulty")
    if best_hour is not None:
        suggestions.append(f"You perform best around {best_hour}:00 — schedule tasks then")
    return suggestions
