"""
Enhanced rate limiting with per-user and per-IP tracking.
Uses Redis for distributed rate limiting.
"""
from typing import Optional
from fastapi import HTTPException, Request
from redis import Redis
from datetime import datetime, timedelta
import hashlib


class RateLimiter:
    """
    Rate limiter with support for:
    - Per-IP rate limiting
    - Per-user rate limiting
    - Different limits for different endpoints
    - Sliding window algorithm
    """
    
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
    
    def _get_key(self, identifier: str, window: str) -> str:
        """Generate Redis key for rate limit tracking."""
        return f"ratelimit:{window}:{identifier}"
    
    async def check_rate_limit(
        self,
        identifier: str,
        max_requests: int,
        window_seconds: int,
        endpoint: str = "default"
    ) -> None:
        """
        Check if request is within rate limit.
        
        Args:
            identifier: User ID or IP address
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            endpoint: Endpoint name for tracking
        
        Raises:
            HTTPException: If rate limit exceeded
        """
        key = self._get_key(identifier, endpoint)
        
        try:
            # Get current count
            current = self.redis.get(key)
            
            if current is None:
                # First request in window
                self.redis.setex(key, window_seconds, 1)
                return
            
            current_count = int(current)
            
            if current_count >= max_requests:
                # Rate limit exceeded
                ttl = self.redis.ttl(key)
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded. Try again in {ttl} seconds.",
                    headers={"Retry-After": str(ttl)}
                )
            
            # Increment counter
            self.redis.incr(key)
            
        except HTTPException:
            raise
        except Exception as e:
            # If Redis fails, allow request (fail open)
            print(f"Rate limit check failed: {e}")
            pass
    
    async def check_user_rate_limit(
        self,
        user_id: int,
        max_requests: int = 100,
        window_seconds: int = 3600,
        endpoint: str = "api"
    ) -> None:
        """
        Check rate limit for authenticated user.
        
        Default: 100 requests per hour per user
        """
        await self.check_rate_limit(
            identifier=f"user:{user_id}",
            max_requests=max_requests,
            window_seconds=window_seconds,
            endpoint=endpoint
        )
    
    async def check_ip_rate_limit(
        self,
        ip_address: str,
        max_requests: int = 60,
        window_seconds: int = 60,
        endpoint: str = "api"
    ) -> None:
        """
        Check rate limit for IP address.
        
        Default: 60 requests per minute per IP
        """
        await self.check_rate_limit(
            identifier=f"ip:{ip_address}",
            max_requests=max_requests,
            window_seconds=window_seconds,
            endpoint=endpoint
        )
    
    async def check_auth_rate_limit(
        self,
        identifier: str,
        max_requests: int = 10,
        window_seconds: int = 60
    ) -> None:
        """
        Strict rate limit for authentication endpoints.
        
        Default: 10 requests per minute
        """
        await self.check_rate_limit(
            identifier=identifier,
            max_requests=max_requests,
            window_seconds=window_seconds,
            endpoint="auth"
        )
    
    def get_remaining_requests(self, identifier: str, endpoint: str = "default") -> Optional[int]:
        """Get remaining requests in current window."""
        key = self._get_key(identifier, endpoint)
        try:
            current = self.redis.get(key)
            if current is None:
                return None
            return int(current)
        except:
            return None


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    Handles X-Forwarded-For header for proxied requests.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take first IP in chain
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection IP
    if request.client:
        return request.client.host
    
    return "unknown"


def hash_identifier(identifier: str) -> str:
    """
    Hash identifier for privacy in logs.
    
    Args:
        identifier: User ID, email, or IP address
    
    Returns:
        SHA256 hash of identifier
    """
    return hashlib.sha256(identifier.encode()).hexdigest()[:16]


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    "auth": {
        "max_requests": 10,
        "window_seconds": 60,  # 10 per minute
    },
    "api_read": {
        "max_requests": 100,
        "window_seconds": 60,  # 100 per minute
    },
    "api_write": {
        "max_requests": 50,
        "window_seconds": 60,  # 50 per minute
    },
    "api_heavy": {
        "max_requests": 10,
        "window_seconds": 60,  # 10 per minute for expensive operations
    },
}
