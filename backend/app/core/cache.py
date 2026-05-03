import redis
from typing import Optional
from app.core.config import settings

_redis_client: redis.Redis = None

def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
    return _redis_client

def cache_set(key: str, value: str, ttl: int = 300) -> None:
    try:
        get_redis().setex(key, ttl, value)
    except Exception:
        pass  # Redis failure must never break the app

def cache_get(key: str) -> Optional[str]:
    try:
        return get_redis().get(key)
    except Exception:
        return None

def cache_delete(key: str) -> None:
    try:
        get_redis().delete(key)
    except Exception:
        pass

def cache_delete_pattern(pattern: str) -> None:
    try:
        r = get_redis()
        cursor = 0
        while True:
            cursor, keys = r.scan(cursor, match=pattern, count=100)
            if keys:
                r.delete(*keys)
            if cursor == 0:
                break
    except Exception:
        pass
