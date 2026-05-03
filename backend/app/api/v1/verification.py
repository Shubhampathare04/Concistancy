from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.utils.deps import get_current_user
import secrets
import hashlib

router = APIRouter()


def generate_verification_token() -> str:
    """Generate a secure verification token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash token for storage."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/send-verification")
def send_verification_email(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Send verification email to user."""
    if user.email_verified:
        return {"status": "already_verified"}
    
    token = generate_verification_token()
    user.verification_token = hash_token(token)
    db.commit()
    
    # TODO: Send email with verification link containing token
    # For now, return token in response (in production, send via email)
    verification_url = f"https://app.consistency.com/verify?token={token}"
    
    return {
        "status": "sent",
        "message": "Verification email sent",
        "verification_url": verification_url  # Remove in production
    }


@router.post("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email with token."""
    token_hash = hash_token(token)
    user = db.query(User).filter(User.verification_token == token_hash).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    if user.email_verified:
        return {"status": "already_verified"}
    
    user.email_verified = True
    user.verification_token = None
    db.commit()
    
    return {"status": "verified", "message": "Email verified successfully"}


@router.get("/status")
def verification_status(user: User = Depends(get_current_user)):
    """Check if user's email is verified."""
    return {
        "email": user.email,
        "verified": user.email_verified
    }
