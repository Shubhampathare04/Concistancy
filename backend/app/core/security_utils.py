"""
Security utilities for authentication and authorization.
Includes account lockout, CSRF protection, and security headers.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session
import secrets
import hashlib


class AccountLockout:
    """
    Handles account lockout after failed login attempts.
    Prevents brute force attacks.
    """
    
    MAX_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30
    
    @staticmethod
    def check_lockout(user) -> None:
        """
        Check if user account is locked.
        
        Args:
            user: User model instance
        
        Raises:
            HTTPException: If account is locked
        """
        if hasattr(user, 'locked_until') and user.locked_until:
            if user.locked_until > datetime.utcnow():
                remaining = (user.locked_until - datetime.utcnow()).seconds // 60
                raise HTTPException(
                    status_code=403,
                    detail=f"Account locked due to too many failed login attempts. Try again in {remaining} minutes."
                )
            else:
                # Lockout expired, reset
                user.locked_until = None
                user.failed_login_attempts = 0
    
    @staticmethod
    def handle_failed_login(db: Session, user) -> None:
        """
        Handle failed login attempt.
        Increments counter and locks account if threshold exceeded.
        
        Args:
            db: Database session
            user: User model instance
        """
        if not hasattr(user, 'failed_login_attempts'):
            return
        
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        
        if user.failed_login_attempts >= AccountLockout.MAX_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(
                minutes=AccountLockout.LOCKOUT_DURATION_MINUTES
            )
        
        db.commit()
    
    @staticmethod
    def handle_successful_login(db: Session, user) -> None:
        """
        Reset failed login counter on successful login.
        
        Args:
            db: Database session
            user: User model instance
        """
        if hasattr(user, 'failed_login_attempts'):
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()


class CSRFProtection:
    """
    CSRF token generation and validation.
    Protects against Cross-Site Request Forgery attacks.
    """
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure CSRF token."""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_token(request: Request, expected_token: str) -> None:
        """
        Validate CSRF token from request.
        
        Args:
            request: FastAPI request object
            expected_token: Expected CSRF token
        
        Raises:
            HTTPException: If token is missing or invalid
        """
        # Check header first
        token = request.headers.get("X-CSRF-Token")
        
        # Fallback to form data
        if not token:
            form_data = request.form()
            token = form_data.get("csrf_token")
        
        if not token:
            raise HTTPException(
                status_code=403,
                detail="CSRF token missing"
            )
        
        if not secrets.compare_digest(token, expected_token):
            raise HTTPException(
                status_code=403,
                detail="CSRF token invalid"
            )


class SecurityHeaders:
    """
    Security headers to add to all responses.
    Protects against common web vulnerabilities.
    """
    
    @staticmethod
    def get_headers() -> dict:
        """
        Get security headers dictionary.
        
        Returns:
            Dictionary of security headers
        """
        return {
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            
            # Enable XSS protection
            "X-XSS-Protection": "1; mode=block",
            
            # Enforce HTTPS
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'"
            ),
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions policy
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=()"
            ),
        }


class TokenRevocation:
    """
    Token revocation for logout and security incidents.
    Uses Redis to track revoked tokens.
    """
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def revoke_token(self, token: str, expires_in: int = 3600) -> None:
        """
        Revoke a JWT token.
        
        Args:
            token: JWT token to revoke
            expires_in: Token expiry time in seconds
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        key = f"revoked_token:{token_hash}"
        self.redis.setex(key, expires_in, "1")
    
    def is_token_revoked(self, token: str) -> bool:
        """
        Check if token is revoked.
        
        Args:
            token: JWT token to check
        
        Returns:
            True if token is revoked, False otherwise
        """
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        key = f"revoked_token:{token_hash}"
        return self.redis.exists(key) > 0
    
    def revoke_all_user_tokens(self, user_id: int, expires_in: int = 3600) -> None:
        """
        Revoke all tokens for a user.
        Useful for password changes or security incidents.
        
        Args:
            user_id: User ID
            expires_in: Token expiry time in seconds
        """
        key = f"revoked_user:{user_id}"
        self.redis.setex(key, expires_in, "1")
    
    def is_user_tokens_revoked(self, user_id: int) -> bool:
        """
        Check if all user tokens are revoked.
        
        Args:
            user_id: User ID
        
        Returns:
            True if all user tokens are revoked
        """
        key = f"revoked_user:{user_id}"
        return self.redis.exists(key) > 0


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a cryptographically secure random token.
    
    Args:
        length: Token length in bytes
    
    Returns:
        URL-safe token string
    """
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    """
    Hash a token for storage.
    
    Args:
        token: Token to hash
    
    Returns:
        SHA256 hash of token
    """
    return hashlib.sha256(token.encode()).hexdigest()


def constant_time_compare(a: str, b: str) -> bool:
    """
    Compare two strings in constant time to prevent timing attacks.
    
    Args:
        a: First string
        b: Second string
    
    Returns:
        True if strings are equal
    """
    return secrets.compare_digest(a, b)
