import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, Streak, UserStats, RefreshToken
from app.schemas.schemas import UserCreate, Token, UserOut, TokenRefreshOut
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token
)
from app.core.security_utils import AccountLockout
from app.core.config import settings


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def register(data: UserCreate, db: Session) -> Token:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name
    )
    db.add(user)
    db.flush()
    db.add(Streak(user_id=user.id))
    db.add(UserStats(user_id=user.id))
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    _store_refresh_token(user.id, refresh_token, db)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user)
    )


def login(data: UserCreate, db: Session) -> Token:
    user = db.query(User).filter(
        User.email == data.email,
        User.deleted_at == None
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check account lockout
    AccountLockout.check_lockout(user)

    if not verify_password(data.password, user.password_hash):
        AccountLockout.handle_failed_login(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Successful login - reset failed attempts
    AccountLockout.handle_successful_login(db, user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    _store_refresh_token(user.id, refresh_token, db)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user)
    )


def refresh_access_token(refresh_token: str, db: Session) -> TokenRefreshOut:
    user_id = decode_refresh_token(refresh_token)
    token_hash = _hash_token(refresh_token)

    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()

    if not stored:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalid or expired"
        )

    # Rotate: revoke old, issue new
    stored.revoked = True
    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    _store_refresh_token(user_id, new_refresh, db)
    db.commit()

    return TokenRefreshOut(access_token=new_access, refresh_token=new_refresh)


def logout(user_id: int, refresh_token: str, db: Session) -> None:
    token_hash = _hash_token(refresh_token)
    db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id
    ).update({"revoked": True})
    db.commit()


def _store_refresh_token(user_id: int, token: str, db: Session) -> None:
    expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(token),
        expires_at=expires
    ))
    db.commit()
