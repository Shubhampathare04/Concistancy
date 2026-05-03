"""
Async database utilities to properly handle sync SQLAlchemy in async FastAPI routes.
Fixes the async/sync mismatch that blocks the event loop.
"""
from typing import Callable, TypeVar, Any
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

T = TypeVar('T')


async def run_in_db_thread(func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
    """
    Execute a synchronous database operation in a thread pool.
    
    Usage:
        result = await run_in_db_thread(db.query(User).filter(User.id == user_id).first)
        
    Or with lambda:
        result = await run_in_db_thread(lambda: db.query(User).all())
    """
    return await run_in_threadpool(func, *args, **kwargs)


async def execute_db_query(db: Session, query_func: Callable[[Session], T]) -> T:
    """
    Execute a database query function in a thread pool.
    
    Usage:
        def get_user(db: Session):
            return db.query(User).filter(User.id == user_id).first()
        
        user = await execute_db_query(db, get_user)
    """
    return await run_in_threadpool(query_func, db)


class AsyncDBMixin:
    """
    Mixin class to add async database operation helpers to service classes.
    
    Usage:
        class TaskService(AsyncDBMixin):
            async def get_tasks(self, db: Session, user_id: int):
                return await self.run_query(
                    db,
                    lambda: db.query(Task).filter(Task.user_id == user_id).all()
                )
    """
    
    @staticmethod
    async def run_query(db: Session, query_func: Callable[[], T]) -> T:
        """Execute a query function in thread pool."""
        return await run_in_threadpool(query_func)
    
    @staticmethod
    async def run_mutation(db: Session, mutation_func: Callable[[], T]) -> T:
        """Execute a mutation (insert/update/delete) in thread pool."""
        result = await run_in_threadpool(mutation_func)
        await run_in_threadpool(db.commit)
        return result
