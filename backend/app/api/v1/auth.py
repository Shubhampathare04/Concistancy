from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import UserCreate, Token
from app.services import auth_service

router = APIRouter()

@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    return auth_service.register(data, db)

@router.post("/login", response_model=Token)
def login(data: UserCreate, db: Session = Depends(get_db)):
    return auth_service.login(data, db)
