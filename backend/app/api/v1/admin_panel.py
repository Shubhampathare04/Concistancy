from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.schemas.admin import *
from app.services.admin_service import AdminService
from app.core.admin_auth import get_current_admin, require_role, get_client_info
from app.models.models import AdminUser
from app.repositories.admin_repository import AdminRepository

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============ AUTH ============
@router.post("/login", response_model=AdminToken)
def admin_login(data: AdminLogin, request: Request, db: Session = Depends(get_db)):
    admin = AdminService.authenticate_admin(db, data.email, data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = AdminService.create_admin_token(admin.id, admin.role)
    AdminRepository.update_last_login(db, admin.id)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "login", "admin", admin.id, 
        None, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": admin.role
    }


@router.get("/me", response_model=AdminUserResponse)
def get_current_admin_info(admin: AdminUser = Depends(get_current_admin)):
    return admin


# ============ USERS ============
@router.get("/users", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = Query(None, regex="^(active|banned|inactive)$"),
    db: Session = Depends(get_db)
):
    return AdminService.get_users(db, page, page_size, search, status)


@router.get("/users/{user_id}", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = AdminService.get_user_detail(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", dependencies=[Depends(require_role("super_admin", "admin"))])
def update_user(
    user_id: int,
    data: UserUpdateRequest,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    AdminService.update_user(db, user_id, update_data)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "update_user", "user", user_id,
        update_data, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "User updated successfully"}


@router.post("/users/{user_id}/ban", dependencies=[Depends(require_role("super_admin", "admin"))])
def ban_user(
    user_id: int,
    data: UserBanRequest,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    AdminService.ban_user(db, user_id, data.reason)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "ban_user", "user", user_id,
        {"reason": data.reason}, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "User banned successfully"}


@router.post("/users/{user_id}/unban", dependencies=[Depends(require_role("super_admin", "admin"))])
def unban_user(
    user_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    AdminService.unban_user(db, user_id)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "unban_user", "user", user_id,
        None, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "User unbanned successfully"}


@router.delete("/users/{user_id}", dependencies=[Depends(require_role("super_admin"))])
def delete_user(
    user_id: int,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    AdminService.delete_user(db, user_id)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "delete_user", "user", user_id,
        None, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "User deleted successfully"}


# ============ ANALYTICS ============
@router.get("/analytics/overview", response_model=AnalyticsOverview, 
            dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_analytics_overview(db: Session = Depends(get_db)):
    return AdminService.get_analytics_overview(db)


@router.get("/analytics/users", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_user_analytics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    return AdminService.get_user_growth(db, days)


@router.get("/analytics/tasks", response_model=TaskAnalytics,
            dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_task_analytics(db: Session = Depends(get_db)):
    return AdminService.get_task_analytics(db)


@router.get("/analytics/streaks", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_streak_analytics(db: Session = Depends(get_db)):
    return AdminService.get_streak_distribution(db)


# ============ TASKS & ACTIVITY ============
@router.get("/tasks", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return AdminService.get_tasks(db, page, page_size, user_id)


@router.get("/activity-logs", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def list_activity_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return AdminService.get_activity_logs(db, page, page_size, user_id)


# ============ SUBSCRIPTIONS ============
@router.get("/subscriptions", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def list_subscriptions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(active|expired|cancelled)$"),
    db: Session = Depends(get_db)
):
    return AdminService.get_subscriptions(db, page, page_size, status)


@router.post("/subscriptions", dependencies=[Depends(require_role("super_admin", "admin"))])
def create_subscription(
    data: SubscriptionCreateRequest,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    AdminService.create_subscription(db, data.user_id, data.plan, data.duration_days)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "create_subscription", "subscription", data.user_id,
        data.dict(), client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "Subscription created successfully"}


@router.patch("/subscriptions/{sub_id}", dependencies=[Depends(require_role("super_admin", "admin"))])
def update_subscription(
    sub_id: int,
    data: SubscriptionUpdateRequest,
    request: Request,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    AdminService.update_subscription(db, sub_id, update_data)
    
    client_info = get_client_info(request)
    AdminService.log_admin_action(
        db, admin.id, "update_subscription", "subscription", sub_id,
        update_data, client_info["ip_address"], client_info["user_agent"]
    )
    
    return {"message": "Subscription updated successfully"}


# ============ PAYMENTS ============
@router.get("/payments", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, regex="^(pending|completed|failed|refunded)$"),
    db: Session = Depends(get_db)
):
    return AdminService.get_payments(db, page, page_size, status)


# ============ SYSTEM HEALTH ============
@router.get("/system/health", dependencies=[Depends(require_role("super_admin", "admin", "analyst"))])
def get_system_health(db: Session = Depends(get_db)):
    import time
    from app.core.config import settings
    
    start = time.time()
    
    # Test MySQL
    mysql_ok = False
    try:
        db.execute("SELECT 1")
        mysql_ok = True
    except:
        pass
    
    # Test Redis
    redis_ok = False
    try:
        from redis import Redis
        r = Redis.from_url(settings.REDIS_URL)
        r.ping()
        redis_ok = True
    except:
        pass
    
    # Test MongoDB
    mongodb_ok = False
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        asyncio.run(client.admin.command('ping'))
        mongodb_ok = True
    except:
        pass
    
    latency = (time.time() - start) * 1000
    
    status_val = "healthy" if (mysql_ok and redis_ok) else "degraded"
    
    return {
        "status": status_val,
        "mysql": mysql_ok,
        "redis": redis_ok,
        "mongodb": mongodb_ok,
        "api_latency_ms": round(latency, 2),
        "uptime_seconds": 0  # Implement uptime tracking
    }


@router.get("/system/metrics", dependencies=[Depends(require_role("super_admin", "admin"))])
def get_system_metrics():
    # Implement with Redis counters or monitoring service
    return {
        "total_requests_24h": 0,
        "error_rate": 0.0,
        "avg_response_time_ms": 0.0,
        "active_connections": 0,
        "cache_hit_rate": 0.0
    }
