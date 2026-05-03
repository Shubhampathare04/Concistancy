from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import (
    TaskCreate, TaskUpdate, TaskOut, PaginatedTasks,
    CompleteTaskRequest, CompleteTaskOut, SyncBatchRequest, SyncBatchResult
)
from app.services import task_service
from app.utils.deps import get_current_user
from app.models.models import User

router = APIRouter()

@router.get("/", response_model=PaginatedTasks)
def get_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_service.get_user_tasks(user.id, db, page=page, page_size=page_size)

@router.post("/", response_model=TaskOut)
def create_task(data: TaskCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.create_task(user.id, data, db)

@router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: int, data: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return task_service.update_task(user.id, task_id, data, db)

@router.delete("/{task_id}")
def delete_task(task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_service.delete_task(user.id, task_id, db)
    return {"status": "deleted"}

@router.post("/{task_id}/complete", response_model=CompleteTaskOut)
def complete_task(
    task_id: int,
    request: CompleteTaskRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return task_service.complete_task(user.id, task_id, request, db)

@router.post("/sync/batch", response_model=SyncBatchResult)
def sync_batch(data: SyncBatchRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    result = task_service.process_sync_batch(user.id, data.actions, db)
    return SyncBatchResult(**result)
