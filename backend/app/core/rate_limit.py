import time
from fastapi import Request, HTTPException, status
from app.core.cache import get_redis
from app.core.config import settings

# Auth endpoints get a stricter limit
_AUTH_PATHS = {"/api/v1/auth/login", "/api/v1/auth/register"}

async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    # Use user_id from JWT if available, else fall back to IP
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        # Use token suffix as key — avoids decoding overhead
        identifier = f"user:{auth_header[-16:]}"
    else:
        identifier = f"ip:{request.client.host if request.client else 'unknown'}"

    is_auth = request.url.path in _AUTH_PATHS
    limit = settings.RATE_LIMIT_AUTH_PER_MINUTE if is_auth else settings.RATE_LIMIT_PER_MINUTE
    key = f"rate_limit:{identifier}"

    try:
        r = get_redis()
        now = time.time()
        window = 60
        pipe = r.pipeline()
        pipe.zremrangebyscore(key, 0, now - window)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window)
        results = pipe.execute()
        request_count = results[2]

        if request_count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Max {limit} requests/minute."
            )
    except HTTPException:
        raise
    except Exception:
        pass

    return await call_next(request)
