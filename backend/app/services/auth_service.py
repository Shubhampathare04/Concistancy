from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, Streak, UserStats
from app.schemas.schemas import UserCreate, Token, UserOut
from app.core.security import hash_password, verify_password, create_access_token

def register(data: UserCreate, db: Session) -> Token:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password), name=data.name)
    db.add(user)
    db.flush()
    db.add(Streak(user_id=user.id))
    db.add(UserStats(user_id=user.id))
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id), user=UserOut.model_validate(user))

def login(data: UserCreate, db: Session) -> Token:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(access_token=create_access_token(user.id), user=UserOut.model_validate(user))
