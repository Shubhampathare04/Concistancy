from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import TaskCreate, TaskOut
from app.services import task_service
from app.utils.deps import get_current_user
from app.models.models import User

router = APIRouter()

@router.post("/", response_model=TaskOut)
def create_task(data: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.create_task(user.id, data, db)

@router.get("/", response_model=List[TaskOut])
def get_tasks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.get_user_tasks(user.id, db)

@router.post("/{task_id}/complete")
def complete_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.complete_task(user.id, task_id, db)
