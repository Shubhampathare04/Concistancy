from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.core.config import settings

# Async MongoDB client (for FastAPI async endpoints)
mongodb_client: AsyncIOMotorClient = None
mongodb_db = None

# Sync MongoDB client (for non-async operations)
sync_mongodb_client: MongoClient = None
sync_mongodb_db = None

async def connect_mongodb():
    global mongodb_client, mongodb_db
    mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
    mongodb_db = mongodb_client.get_default_database()
    print("✅ Connected to MongoDB (async)")

async def close_mongodb():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("❌ Closed MongoDB connection")

def get_mongodb():
    return mongodb_db

def connect_sync_mongodb():
    global sync_mongodb_client, sync_mongodb_db
    sync_mongodb_client = MongoClient(settings.MONGODB_URI)
    sync_mongodb_db = sync_mongodb_client.get_default_database()
    return sync_mongodb_db
