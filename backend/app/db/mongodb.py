from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app.core.config import settings

# Async MongoDB client (for FastAPI async endpoints)
mongodb_client: AsyncIOMotorClient = None
mongodb_db = None

# Sync MongoDB client (for non-async operations)
sync_mongodb_client: MongoClient = None
sync_mongodb_db = None

async def connect_mongodb():
    global mongodb_client, mongodb_db
    try:
        mongodb_client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )
        # Force server selection now so startup fails fast on bad URI/network/auth.
        await mongodb_client.admin.command("ping")
        mongodb_db = mongodb_client.get_default_database()
        print("✅ Connected to MongoDB (async)")
    except PyMongoError as exc:
        print(f"❌ MongoDB connection failed: {exc}")
        if mongodb_client:
            mongodb_client.close()
        mongodb_client = None
        mongodb_db = None
        raise RuntimeError(f"MongoDB startup connection failed: {exc}") from exc

async def close_mongodb():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("❌ Closed MongoDB connection")

def get_mongodb():
    return mongodb_db

def connect_sync_mongodb():
    global sync_mongodb_client, sync_mongodb_db
    try:
        sync_mongodb_client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )
        sync_mongodb_client.admin.command("ping")
        sync_mongodb_db = sync_mongodb_client.get_default_database()
        return sync_mongodb_db
    except PyMongoError as exc:
        print(f"❌ MongoDB sync connection failed: {exc}")
        if sync_mongodb_client:
            sync_mongodb_client.close()
        sync_mongodb_client = None
        sync_mongodb_db = None
        raise RuntimeError(f"MongoDB sync connection failed: {exc}") from exc
