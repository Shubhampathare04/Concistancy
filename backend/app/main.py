from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, tasks, stats
from app.db.session import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Consistency API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["stats"])

@app.get("/health")
def health():
    return {"status": "ok"}
