"""
Input sanitization and validation utilities.
Prevents XSS, SQL injection, and other input-based attacks.
"""
import re
import html
from typing import Optional


def sanitize_text(text: Optional[str], max_length: Optional[int] = None) -> str:
    """
    Sanitize text input by:
    1. Stripping leading/trailing whitespace
    2. Escaping HTML entities
    3. Removing control characters
    4. Enforcing max length
    
    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length (optional)
    
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Strip whitespace
    text = text.strip()
    
    # Escape HTML entities to prevent XSS
    text = html.escape(text)
    
    # Remove control characters except newlines and tabs
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Enforce max length
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def sanitize_email(email: str) -> str:
    """
    Sanitize and validate email address.
    
    Args:
        email: Email address to sanitize
    
    Returns:
        Sanitized email in lowercase
    
    Raises:
        ValueError: If email format is invalid
    """
    if not email:
        raise ValueError("Email cannot be empty")
    
    email = email.strip().lower()
    
    # Basic email validation regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    
    if len(email) > 255:
        raise ValueError("Email too long")
    
    return email


def validate_password(password: str) -> None:
    """
    Validate password strength.
    
    Requirements:
    - At least 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
    
    Raises:
        ValueError: If password doesn't meet requirements
    """
    if len(password) < 12:
        raise ValueError("Password must be at least 12 characters long")
    
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValueError("Password must contain at least one special character")


def sanitize_integer(value: any, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    """
    Sanitize and validate integer input.
    
    Args:
        value: Value to sanitize
        min_val: Minimum allowed value (optional)
        max_val: Maximum allowed value (optional)
    
    Returns:
        Validated integer
    
    Raises:
        ValueError: If value is invalid
    """
    try:
        int_val = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid integer value: {value}")
    
    if min_val is not None and int_val < min_val:
        raise ValueError(f"Value must be at least {min_val}")
    
    if max_val is not None and int_val > max_val:
        raise ValueError(f"Value must be at most {max_val}")
    
    return int_val


def sanitize_difficulty(difficulty: int) -> int:
    """Validate task difficulty (1-5)."""
    return sanitize_integer(difficulty, min_val=1, max_val=5)


def sanitize_mood(mood: int) -> int:
    """Validate mood value (1-5)."""
    return sanitize_integer(mood, min_val=1, max_val=5)


def sanitize_url(url: Optional[str]) -> Optional[str]:
    """
    Sanitize URL input.
    
    Args:
        url: URL to sanitize
    
    Returns:
        Sanitized URL or None
    
    Raises:
        ValueError: If URL format is invalid
    """
    if not url:
        return None
    
    url = url.strip()
    
    # Basic URL validation
    url_pattern = r'^https?://[^\s<>"{}|\\^`\[\]]+$'
    if not re.match(url_pattern, url):
        raise ValueError("Invalid URL format")
    
    if len(url) > 2048:
        raise ValueError("URL too long")
    
    return url


def redact_sensitive_data(data: dict) -> dict:
    """
    Redact sensitive fields from a dictionary for logging.
    
    Args:
        data: Dictionary potentially containing sensitive data
    
    Returns:
        Dictionary with sensitive fields redacted
    """
    sensitive_keys = {
        'password', 'password_hash', 'token', 'access_token', 
        'refresh_token', 'secret', 'api_key', 'jwt', 'auth'
    }
    
    redacted = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            redacted[key] = '***REDACTED***'
        elif isinstance(value, dict):
            redacted[key] = redact_sensitive_data(value)
        else:
            redacted[key] = value
    
    return redacted
