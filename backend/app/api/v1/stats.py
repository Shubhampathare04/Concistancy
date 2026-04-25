from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import DashboardOut
from app.services import task_service
from app.utils.deps import get_current_user
from app.models.models import User

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOut)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.get_dashboard(user.id, db)
