"""
Sentry Error Tracking Configuration
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
import os


def init_sentry():
    """Initialize Sentry error tracking"""
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("ENVIRONMENT", "development")
    
    if not sentry_dsn:
        print("⚠️  SENTRY_DSN not configured - error tracking disabled")
        return
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        traces_sample_rate=0.1 if environment == "production" else 1.0,
        profiles_sample_rate=0.1 if environment == "production" else 1.0,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring
        # Adjust this value in production
        send_default_pii=False,  # Don't send personally identifiable information
        attach_stacktrace=True,
        before_send=before_send_filter,
    )
    
    print(f"✅ Sentry initialized for {environment} environment")


def before_send_filter(event, hint):
    """Filter events before sending to Sentry"""
    # Don't send health check errors
    if "transaction" in event:
        if event["transaction"] in ["/health", "/health/detailed"]:
            return None
    
    # Don't send 404 errors
    if "exception" in event:
        for exception in event["exception"].get("values", []):
            if "404" in str(exception.get("value", "")):
                return None
    
    return event


def capture_exception(error: Exception, context: dict = None):
    """Manually capture an exception with context"""
    if context:
        sentry_sdk.set_context("custom", context)
    sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", context: dict = None):
    """Manually capture a message with context"""
    if context:
        sentry_sdk.set_context("custom", context)
    sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: int, username: str = None, email: str = None):
    """Set user context for error tracking"""
    sentry_sdk.set_user({
        "id": user_id,
        "username": username,
        "email": email,
    })
