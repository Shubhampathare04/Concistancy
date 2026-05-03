from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.repositories.admin_repository import AdminRepository
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdminService:
    
    @staticmethod
    def authenticate_admin(db: Session, email: str, password: str):
        admin = AdminRepository.get_admin_by_email(db, email)
        if not admin or not pwd_context.verify(password, admin.password_hash):
            return None
        if not admin.is_active:
            return None
        return admin
    
    @staticmethod
    def create_admin_token(admin_id: int, role: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(admin_id),
            "role": role,
            "type": "admin",
            "exp": expire
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    @staticmethod
    def log_admin_action(db: Session, admin_id: int, action: str, entity_type: str,
                        entity_id: Optional[int], meta_data: Optional[Dict],
                        ip_address: Optional[str], user_agent: Optional[str]):
        AdminRepository.create_audit_log(
            db, admin_id, action, entity_type, entity_id, 
            meta_data, ip_address, user_agent
        )
    
    @staticmethod
    def get_users(db: Session, page: int, page_size: int, search: Optional[str], status: Optional[str]):
        users, total = AdminRepository.get_users_paginated(db, page, page_size, search, status)
        
        items = []
        for user, completions, streak, level in users:
            items.append({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "is_active": user.is_active,
                "is_onboarded": user.is_onboarded,
                "banned_at": user.banned_at,
                "created_at": user.created_at,
                "total_completions": completions or 0,
                "current_streak": streak or 0,
                "level": level or 1
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    @staticmethod
    def get_user_detail(db: Session, user_id: int):
        result = AdminRepository.get_user_detail(db, user_id)
        if not result:
            return None
        
        user, stats, streak, subscription = result
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "goal": user.goal,
            "timezone": user.timezone,
            "is_active": user.is_active,
            "is_onboarded": user.is_onboarded,
            "email_verified": user.email_verified,
            "banned_at": user.banned_at,
            "created_at": user.created_at,
            "xp": stats.xp if stats else 0,
            "level": stats.level if stats else 1,
            "coins": stats.coins if stats else 0,
            "total_completions": stats.total_completions if stats else 0,
            "consistency_index": stats.consistency_index if stats else 0.0,
            "current_streak": streak.current_streak if streak else 0,
            "longest_streak": streak.longest_streak if streak else 0,
            "subscription_plan": subscription.plan if subscription else "free"
        }
    
    @staticmethod
    def ban_user(db: Session, user_id: int, reason: str):
        AdminRepository.ban_user(db, user_id, reason)
    
    @staticmethod
    def unban_user(db: Session, user_id: int):
        AdminRepository.unban_user(db, user_id)
    
    @staticmethod
    def update_user(db: Session, user_id: int, data: Dict):
        AdminRepository.update_user(db, user_id, data)
    
    @staticmethod
    def delete_user(db: Session, user_id: int):
        AdminRepository.delete_user(db, user_id)
    
    @staticmethod
    def get_analytics_overview(db: Session):
        return AdminRepository.get_analytics_overview(db)
    
    @staticmethod
    def get_user_growth(db: Session, days: int = 30):
        growth = AdminRepository.get_user_growth(db, days)
        
        result = []
        cumulative = 0
        for date, new_users in growth:
            cumulative += new_users
            result.append({
                "date": str(date),
                "new_users": new_users,
                "total_users": cumulative,
                "dau": new_users  # Simplified
            })
        
        return result
    
    @staticmethod
    def get_task_analytics(db: Session):
        return AdminRepository.get_task_analytics(db)
    
    @staticmethod
    def get_streak_distribution(db: Session):
        return AdminRepository.get_streak_distribution(db)
    
    @staticmethod
    def get_subscriptions(db: Session, page: int, page_size: int, status: Optional[str]):
        subs, total = AdminRepository.get_subscriptions_paginated(db, page, page_size, status)
        
        items = []
        for sub, email, name in subs:
            items.append({
                "id": sub.id,
                "user_id": sub.user_id,
                "user_email": email,
                "user_name": name,
                "plan": sub.plan,
                "status": sub.status,
                "expires_at": sub.expires_at,
                "created_at": sub.created_at
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    @staticmethod
    def create_subscription(db: Session, user_id: int, plan: str, duration_days: int):
        AdminRepository.create_subscription(db, user_id, plan, duration_days)
    
    @staticmethod
    def update_subscription(db: Session, sub_id: int, data: Dict):
        AdminRepository.update_subscription(db, sub_id, data)
    
    @staticmethod
    def get_payments(db: Session, page: int, page_size: int, status: Optional[str]):
        payments, total = AdminRepository.get_payments_paginated(db, page, page_size, status)
        
        items = []
        for payment, email in payments:
            items.append({
                "id": payment.id,
                "user_id": payment.user_id,
                "user_email": email,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "provider": payment.provider,
                "created_at": payment.created_at
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    @staticmethod
    def get_activity_logs(db: Session, page: int, page_size: int, user_id: Optional[int]):
        logs, total = AdminRepository.get_activity_logs(db, page, page_size, user_id)
        
        items = [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action_type": log.action_type,
                "meta": log.meta,
                "created_at": log.created_at
            }
            for log in logs
        ]
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    @staticmethod
    def get_tasks(db: Session, page: int, page_size: int, user_id: Optional[int]):
        tasks, total = AdminRepository.get_tasks_paginated(db, page, page_size, user_id)
        
        items = []
        for task, email, name in tasks:
            items.append({
                "id": task.id,
                "user_id": task.user_id,
                "user_email": email,
                "user_name": name,
                "title": task.title,
                "difficulty": task.difficulty,
                "schedule_type": task.schedule_type,
                "is_active": task.is_active,
                "created_at": task.created_at
            })
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
