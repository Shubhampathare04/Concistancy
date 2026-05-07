from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.utils.deps import get_current_user
from app.models.models import User
from app.services.push_notification_service import push_service, NotificationTemplates


router = APIRouter()


class FCMTokenRequest(BaseModel):
    token: str


class TestNotificationRequest(BaseModel):
    title: str
    body: str


@router.post("/register-token", status_code=status.HTTP_200_OK)
async def register_fcm_token(
    request: FCMTokenRequest,
    current_user: User = Depends(get_current_user)
):
    """Register FCM token for push notifications"""
    success = await push_service.register_token(current_user.id, request.token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register token"
        )
    return {"status": "success", "message": "Token registered successfully"}


@router.post("/unregister-token", status_code=status.HTTP_200_OK)
async def unregister_fcm_token(
    request: FCMTokenRequest,
    current_user: User = Depends(get_current_user)
):
    """Unregister FCM token"""
    success = await push_service.unregister_token(current_user.id, request.token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unregister token"
        )
    return {"status": "success", "message": "Token unregistered successfully"}


@router.post("/test", status_code=status.HTTP_200_OK)
async def send_test_notification(
    request: TestNotificationRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a test notification (for development/testing)"""
    success = await push_service.send_notification(
        current_user.id,
        request.title,
        request.body,
        {"type": "test"}
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send notification"
        )
    return {"status": "success", "message": "Test notification sent"}
