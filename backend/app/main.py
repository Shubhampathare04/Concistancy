from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.api.v1 import auth, tasks, stats, habits, events, social, professionals, subscriptions, ai, mood, groups, verification
from app.core.rate_limit import rate_limit_middleware
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tables are managed by Alembic migrations — run `alembic upgrade head` before starting
    # Register community event handlers
    import app.services.community_events  # noqa: F401
    
    # Connect to MongoDB
    from app.db.mongodb import connect_mongodb, close_mongodb
    await connect_mongodb()
    
    yield
    
    # Close MongoDB connection
    await close_mongodb()


app = FastAPI(
    title="Consistency API",
    version="2.0.0",
    description="AI-powered behavior tracking system",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

app.include_router(auth.router,          prefix="/api/v1/auth",          tags=["auth"])
app.include_router(tasks.router,         prefix="/api/v1/tasks",         tags=["tasks"])
app.include_router(stats.router,         prefix="/api/v1/stats",         tags=["stats"])
app.include_router(habits.router,        prefix="/api/v1/habits",        tags=["habits"])
app.include_router(events.router,        prefix="/api/v1/events",        tags=["events"])
app.include_router(social.router,        prefix="/api/v1/social",        tags=["social"])
app.include_router(professionals.router, prefix="/api/v1/professionals", tags=["professionals"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
app.include_router(ai.router,            prefix="/api/v1/ai",            tags=["ai"])
app.include_router(mood.router,          prefix="/api/v1/mood",          tags=["mood"])
app.include_router(groups.router,        prefix="/api/v1/groups",        tags=["groups"])
app.include_router(verification.router,  prefix="/api/v1/verification",  tags=["verification"])


@app.get("/health")
def health():
    """Basic health check."""
    return {"status": "ok", "version": "2.0.0"}


@app.get("/health/detailed")
async def detailed_health():
    """Detailed health check with DB and Redis status."""
    from sqlalchemy import text
    from app.db.session import SessionLocal
    from app.core.cache import get_redis
    from app.db.mongodb import mongodb_client
    
    status = {"status": "ok", "version": "2.0.0", "services": {}}
    
    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        status["services"]["database"] = "healthy"
    except Exception as e:
        status["services"]["database"] = f"unhealthy: {str(e)}"
        status["status"] = "degraded"
    
    # Check Redis
    try:
        redis_client = get_redis()
        if redis_client:
            redis_client.ping()
            status["services"]["redis"] = "healthy"
        else:
            status["services"]["redis"] = "not_configured"
    except Exception as e:
        status["services"]["redis"] = f"unhealthy: {str(e)}"
        status["status"] = "degraded"
    
    # Check MongoDB
    try:
        if mongodb_client:
            await mongodb_client.admin.command('ping')
            status["services"]["mongodb"] = "healthy"
        else:
            status["services"]["mongodb"] = "not_connected"
    except Exception as e:
        status["services"]["mongodb"] = f"unhealthy: {str(e)}"
        status["status"] = "degraded"
    
    return status
