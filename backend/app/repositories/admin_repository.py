from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import func, and_, or_, desc, case
from sqlalchemy.orm import Session
from app.models.models import (
    AdminUser, AuditLog, User, Task, TaskCompletion, TaskSkip,
    Streak, UserStats, Subscription, Payment, ActivityLog
)


class AdminRepository:
    
    @staticmethod
    def get_admin_by_email(db: Session, email: str) -> Optional[AdminUser]:
        return db.query(AdminUser).filter(AdminUser.email == email).first()
    
    @staticmethod
    def update_last_login(db: Session, admin_id: int):
        db.query(AdminUser).filter(AdminUser.id == admin_id).update({"last_login_at": datetime.utcnow()})
        db.commit()
    
    @staticmethod
    def create_audit_log(db: Session, admin_id: int, action: str, entity_type: str, 
                        entity_id: Optional[int], meta_data: Optional[Dict], 
                        ip_address: Optional[str], user_agent: Optional[str]):
        log = AuditLog(
            admin_id=admin_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            meta_data=meta_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.add(log)
        db.commit()
    
    # User Management
    @staticmethod
    def get_users_paginated(db: Session, page: int, page_size: int, 
                           search: Optional[str], status: Optional[str]):
        query = db.query(
            User,
            UserStats.total_completions,
            Streak.current_streak,
            UserStats.level
        ).outerjoin(UserStats, User.id == UserStats.user_id)\
         .outerjoin(Streak, User.id == Streak.user_id)
        
        if search:
            query = query.filter(
                or_(
                    User.email.ilike(f"%{search}%"),
                    User.name.ilike(f"%{search}%")
                )
            )
        
        if status == "active":
            query = query.filter(User.is_active == True, User.banned_at.is_(None))
        elif status == "banned":
            query = query.filter(User.banned_at.isnot(None))
        elif status == "inactive":
            query = query.filter(User.is_active == False)
        
        total = query.count()
        users = query.order_by(desc(User.created_at))\
                    .offset((page - 1) * page_size)\
                    .limit(page_size)\
                    .all()
        
        return users, total
    
    @staticmethod
    def get_user_detail(db: Session, user_id: int):
        return db.query(
            User,
            UserStats,
            Streak,
            Subscription
        ).outerjoin(UserStats, User.id == UserStats.user_id)\
         .outerjoin(Streak, User.id == Streak.user_id)\
         .outerjoin(Subscription, User.id == Subscription.user_id)\
         .filter(User.id == user_id)\
         .first()
    
    @staticmethod
    def ban_user(db: Session, user_id: int, reason: str):
        db.query(User).filter(User.id == user_id).update({
            "banned_at": datetime.utcnow(),
            "ban_reason": reason,
            "is_active": False
        })
        db.commit()
    
    @staticmethod
    def unban_user(db: Session, user_id: int):
        db.query(User).filter(User.id == user_id).update({
            "banned_at": None,
            "ban_reason": None,
            "is_active": True
        })
        db.commit()
    
    @staticmethod
    def update_user(db: Session, user_id: int, data: Dict):
        db.query(User).filter(User.id == user_id).update(data)
        db.commit()
    
    @staticmethod
    def delete_user(db: Session, user_id: int):
        db.query(User).filter(User.id == user_id).update({"deleted_at": datetime.utcnow()})
        db.commit()
    
    # Analytics
    @staticmethod
    def get_analytics_overview(db: Session):
        now = datetime.utcnow()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        total_users = db.query(func.count(User.id)).filter(User.deleted_at.is_(None)).scalar()
        
        dau = db.query(func.count(func.distinct(ActivityLog.user_id)))\
            .filter(ActivityLog.created_at >= today)\
            .scalar() or 0
        
        wau = db.query(func.count(func.distinct(ActivityLog.user_id)))\
            .filter(ActivityLog.created_at >= week_ago)\
            .scalar() or 0
        
        mau = db.query(func.count(func.distinct(ActivityLog.user_id)))\
            .filter(ActivityLog.created_at >= month_ago)\
            .scalar() or 0
        
        total_tasks = db.query(func.count(Task.id))\
            .filter(Task.deleted_at.is_(None))\
            .scalar()
        
        total_completions = db.query(func.count(TaskCompletion.id)).scalar()
        
        total_expected = db.query(func.count(Task.id))\
            .filter(Task.is_active == True, Task.schedule_type.in_(["daily", "weekly"]))\
            .scalar()
        
        completion_rate = (total_completions / max(total_expected, 1)) * 100
        
        avg_streak = db.query(func.avg(Streak.current_streak)).scalar() or 0.0
        
        total_revenue = db.query(func.sum(Payment.amount))\
            .filter(Payment.status == "completed")\
            .scalar() or 0.0
        
        mrr = db.query(func.sum(Payment.amount))\
            .filter(
                Payment.status == "completed",
                Payment.created_at >= month_ago
            ).scalar() or 0.0
        
        active_subs = db.query(func.count(Subscription.id))\
            .filter(Subscription.status == "active")\
            .scalar()
        
        return {
            "total_users": total_users,
            "active_users_today": dau,
            "active_users_7d": wau,
            "active_users_30d": mau,
            "total_tasks": total_tasks,
            "total_completions": total_completions,
            "completion_rate": round(completion_rate, 2),
            "avg_streak": round(avg_streak, 2),
            "total_revenue": round(total_revenue, 2),
            "mrr": round(mrr, 2),
            "active_subscriptions": active_subs
        }
    
    @staticmethod
    def get_user_growth(db: Session, days: int = 30):
        start_date = datetime.utcnow() - timedelta(days=days)
        
        growth = db.query(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("new_users")
        ).filter(User.created_at >= start_date)\
         .group_by(func.date(User.created_at))\
         .order_by(func.date(User.created_at))\
         .all()
        
        return growth
    
    @staticmethod
    def get_task_analytics(db: Session):
        now = datetime.utcnow()
        today = now.date()
        week_ago = now - timedelta(days=7)
        
        total_tasks = db.query(func.count(Task.id)).filter(Task.deleted_at.is_(None)).scalar()
        active_tasks = db.query(func.count(Task.id)).filter(Task.is_active == True).scalar()
        avg_difficulty = db.query(func.avg(Task.difficulty)).scalar() or 0.0
        
        total_completions = db.query(func.count(TaskCompletion.id)).scalar()
        total_skips = db.query(func.count(TaskSkip.id)).scalar()
        completion_rate = (total_completions / max(total_completions + total_skips, 1)) * 100
        
        completions_today = db.query(func.count(TaskCompletion.id))\
            .filter(func.date(TaskCompletion.completed_at) == today)\
            .scalar()
        
        completions_7d = db.query(func.count(TaskCompletion.id))\
            .filter(TaskCompletion.completed_at >= week_ago)\
            .scalar()
        
        return {
            "total_tasks": total_tasks,
            "active_tasks": active_tasks,
            "avg_difficulty": round(avg_difficulty, 2),
            "completion_rate": round(completion_rate, 2),
            "total_completions": total_completions,
            "completions_today": completions_today,
            "completions_7d": completions_7d
        }
    
    @staticmethod
    def get_streak_distribution(db: Session):
        streaks = db.query(Streak.current_streak).all()
        
        ranges = {
            "0": 0,
            "1-7": 0,
            "8-30": 0,
            "31-90": 0,
            "90+": 0
        }
        
        for (streak,) in streaks:
            if streak == 0:
                ranges["0"] += 1
            elif 1 <= streak <= 7:
                ranges["1-7"] += 1
            elif 8 <= streak <= 30:
                ranges["8-30"] += 1
            elif 31 <= streak <= 90:
                ranges["31-90"] += 1
            else:
                ranges["90+"] += 1
        
        return [{"range": k, "count": v} for k, v in ranges.items()]
    
    # Subscriptions
    @staticmethod
    def get_subscriptions_paginated(db: Session, page: int, page_size: int, status: Optional[str]):
        query = db.query(Subscription, User.email, User.name)\
            .join(User, Subscription.user_id == User.id)
        
        if status:
            query = query.filter(Subscription.status == status)
        
        total = query.count()
        subs = query.order_by(desc(Subscription.created_at))\
                   .offset((page - 1) * page_size)\
                   .limit(page_size)\
                   .all()
        
        return subs, total
    
    @staticmethod
    def create_subscription(db: Session, user_id: int, plan: str, duration_days: int):
        expires_at = datetime.utcnow() + timedelta(days=duration_days)
        
        existing = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if existing:
            existing.plan = plan
            existing.status = "active"
            existing.expires_at = expires_at
        else:
            sub = Subscription(
                user_id=user_id,
                plan=plan,
                status="active",
                expires_at=expires_at
            )
            db.add(sub)
        
        db.commit()
    
    @staticmethod
    def update_subscription(db: Session, sub_id: int, data: Dict):
        if "duration_days" in data:
            duration = data.pop("duration_days")
            data["expires_at"] = datetime.utcnow() + timedelta(days=duration)
        
        db.query(Subscription).filter(Subscription.id == sub_id).update(data)
        db.commit()
    
    # Payments
    @staticmethod
    def get_payments_paginated(db: Session, page: int, page_size: int, status: Optional[str]):
        query = db.query(Payment, User.email)\
            .join(User, Payment.user_id == User.id)
        
        if status:
            query = query.filter(Payment.status == status)
        
        total = query.count()
        payments = query.order_by(desc(Payment.created_at))\
                       .offset((page - 1) * page_size)\
                       .limit(page_size)\
                       .all()
        
        return payments, total
    
    # Activity Logs
    @staticmethod
    def get_activity_logs(db: Session, page: int, page_size: int, user_id: Optional[int]):
        query = db.query(ActivityLog)
        
        if user_id:
            query = query.filter(ActivityLog.user_id == user_id)
        
        total = query.count()
        logs = query.order_by(desc(ActivityLog.created_at))\
                   .offset((page - 1) * page_size)\
                   .limit(page_size)\
                   .all()
        
        return logs, total
    
    # Tasks
    @staticmethod
    def get_tasks_paginated(db: Session, page: int, page_size: int, user_id: Optional[int]):
        query = db.query(Task, User.email, User.name)\
            .join(User, Task.user_id == User.id)\
            .filter(Task.deleted_at.is_(None))
        
        if user_id:
            query = query.filter(Task.user_id == user_id)
        
        total = query.count()
        tasks = query.order_by(desc(Task.created_at))\
                    .offset((page - 1) * page_size)\
                    .limit(page_size)\
                    .all()
        
        return tasks, total
