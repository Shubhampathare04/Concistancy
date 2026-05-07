"""
Push Notification Service using Firebase Cloud Messaging (FCM)
"""
from typing import List, Optional, Dict, Any
import httpx
import os
import json
from datetime import datetime
from app.db.mongodb import get_mongodb


class PushNotificationService:
    """Service for sending push notifications via FCM"""
    
    def __init__(self):
        self.fcm_server_key = os.getenv("FCM_SERVER_KEY")
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"
        
    async def send_notification(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        badge: Optional[int] = None
    ) -> bool:
        """Send push notification to a user"""
        if not self.fcm_server_key:
            print("⚠️  FCM_SERVER_KEY not configured - notifications disabled")
            return False
        
        # Get user's FCM tokens from MongoDB
        tokens = await self._get_user_tokens(user_id)
        if not tokens:
            print(f"No FCM tokens found for user {user_id}")
            return False
        
        # Send to all user's devices
        success_count = 0
        for token in tokens:
            if await self._send_to_token(token, title, body, data, badge):
                success_count += 1
        
        # Log notification to MongoDB
        await self._log_notification(user_id, title, body, data)
        
        return success_count > 0
    
    async def send_bulk_notification(
        self,
        user_ids: List[int],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> int:
        """Send notification to multiple users"""
        success_count = 0
        for user_id in user_ids:
            if await self.send_notification(user_id, title, body, data):
                success_count += 1
        return success_count
    
    async def _send_to_token(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]],
        badge: Optional[int]
    ) -> bool:
        """Send notification to a specific FCM token"""
        headers = {
            "Authorization": f"Bearer {self.fcm_server_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "to": token,
            "notification": {
                "title": title,
                "body": body,
                "sound": "default",
            },
            "priority": "high",
        }
        
        if badge is not None:
            payload["notification"]["badge"] = badge
        
        if data:
            payload["data"] = data
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.fcm_url,
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success") == 1:
                        return True
                    else:
                        # Token might be invalid, remove it
                        if result.get("results", [{}])[0].get("error") in ["InvalidRegistration", "NotRegistered"]:
                            await self._remove_invalid_token(token)
                        return False
                else:
                    print(f"FCM error: {response.status_code} - {response.text}")
                    return False
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            return False
    
    async def _get_user_tokens(self, user_id: int) -> List[str]:
        """Get all FCM tokens for a user from MongoDB"""
        try:
            db = await get_mongodb()
            user_doc = await db.users.find_one({"user_id": user_id})
            if user_doc and "fcm_tokens" in user_doc:
                return user_doc["fcm_tokens"]
            return []
        except Exception as e:
            print(f"Error getting user tokens: {str(e)}")
            return []
    
    async def register_token(self, user_id: int, token: str) -> bool:
        """Register a new FCM token for a user"""
        try:
            db = await get_mongodb()
            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$addToSet": {"fcm_tokens": token},
                    "$set": {"updated_at": datetime.utcnow()}
                },
                upsert=True
            )
            return True
        except Exception as e:
            print(f"Error registering token: {str(e)}")
            return False
    
    async def unregister_token(self, user_id: int, token: str) -> bool:
        """Remove an FCM token for a user"""
        try:
            db = await get_mongodb()
            await db.users.update_one(
                {"user_id": user_id},
                {
                    "$pull": {"fcm_tokens": token},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return True
        except Exception as e:
            print(f"Error unregistering token: {str(e)}")
            return False
    
    async def _remove_invalid_token(self, token: str):
        """Remove an invalid token from all users"""
        try:
            db = await get_mongodb()
            await db.users.update_many(
                {"fcm_tokens": token},
                {"$pull": {"fcm_tokens": token}}
            )
        except Exception:
            pass
    
    async def _log_notification(
        self,
        user_id: int,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]]
    ):
        """Log notification to MongoDB for tracking"""
        try:
            db = await get_mongodb()
            await db.notifications.insert_one({
                "user_id": user_id,
                "title": title,
                "body": body,
                "data": data or {},
                "sent_at": datetime.utcnow(),
                "type": "push"
            })
        except Exception:
            pass


# Notification templates
class NotificationTemplates:
    """Pre-defined notification templates"""
    
    @staticmethod
    def task_reminder(task_title: str) -> tuple:
        """Task reminder notification"""
        return (
            "Task Reminder",
            f"Don't forget: {task_title}",
            {"type": "task_reminder"}
        )
    
    @staticmethod
    def streak_milestone(streak_days: int) -> tuple:
        """Streak milestone notification"""
        return (
            f"🔥 {streak_days} Day Streak!",
            f"Amazing! You've maintained your streak for {streak_days} days!",
            {"type": "streak_milestone", "days": streak_days}
        )
    
    @staticmethod
    def level_up(new_level: int) -> tuple:
        """Level up notification"""
        return (
            f"🎉 Level {new_level}!",
            f"Congratulations! You've reached level {new_level}!",
            {"type": "level_up", "level": new_level}
        )
    
    @staticmethod
    def connection_request(username: str) -> tuple:
        """Connection request notification"""
        return (
            "New Connection Request",
            f"{username} wants to connect with you",
            {"type": "connection_request"}
        )
    
    @staticmethod
    def group_message(group_name: str, sender: str) -> tuple:
        """Group message notification"""
        return (
            f"New message in {group_name}",
            f"{sender}: sent a message",
            {"type": "group_message"}
        )
    
    @staticmethod
    def challenge_invite(challenge_name: str) -> tuple:
        """Challenge invitation notification"""
        return (
            "Challenge Invitation",
            f"You've been invited to join: {challenge_name}",
            {"type": "challenge_invite"}
        )
    
    @staticmethod
    def daily_summary(tasks_completed: int, xp_gained: int) -> tuple:
        """Daily summary notification"""
        return (
            "Daily Summary",
            f"Today: {tasks_completed} tasks completed, {xp_gained} XP gained!",
            {"type": "daily_summary"}
        )


# Global instance
push_service = PushNotificationService()
