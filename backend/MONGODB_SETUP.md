# MongoDB Setup - Consistency App

## ✅ Database Created Successfully

**Database Name:** `consistency_app`  
**Cluster:** cluster0.xrqr6fv.mongodb.net  
**Connection Status:** ✅ Healthy

---

## 📦 Collections Created

| Collection | Purpose | Indexes |
|---|---|---|
| **users** | User accounts | email (unique), created_at |
| **tasks** | User tasks | user_id, created_at, status |
| **habits** | User habits | user_id, created_at |
| **completions** | Task completions | user_id, task_id, completed_at |
| **stats** | User statistics | user_id (unique), updated_at |
| **streaks** | Streak tracking | user_id, task_id |
| **notifications** | Push notifications | user_id, created_at, read |
| **sync_queue** | Offline sync queue | user_id, created_at, synced |

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
MONGODB_URI=mongodb+srv://dineshdg:Dinu%402003@cluster0.xrqr6fv.mongodb.net/consistency_app?retryWrites=true&w=majority&appName=Cluster0
```

### Connection Module
Location: `app/db/mongodb.py`

```python
from app.db.mongodb import get_mongodb

# In async endpoints
async def example_endpoint():
    db = get_mongodb()
    users = db['users']
    
    # Insert
    result = await users.insert_one({"email": "user@example.com"})
    
    # Find
    user = await users.find_one({"email": "user@example.com"})
    
    # Update
    await users.update_one(
        {"email": "user@example.com"},
        {"$set": {"name": "John"}}
    )
    
    # Delete
    await users.delete_one({"email": "user@example.com"})
```

---

## 🚀 Usage Examples

### 1. Create User
```python
from app.db.mongodb import get_mongodb
from datetime import datetime

async def create_user(email: str, password_hash: str):
    db = get_mongodb()
    users = db['users']
    
    user = {
        "email": email,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
        "level": 1,
        "xp": 0,
        "streak": 0
    }
    
    result = await users.insert_one(user)
    return str(result.inserted_id)
```

### 2. Create Task
```python
async def create_task(user_id: str, title: str, difficulty: int):
    db = get_mongodb()
    tasks = db['tasks']
    
    task = {
        "user_id": user_id,
        "title": title,
        "difficulty": difficulty,
        "status": "active",
        "created_at": datetime.utcnow()
    }
    
    result = await tasks.insert_one(task)
    return str(result.inserted_id)
```

### 3. Track Completion
```python
async def complete_task(user_id: str, task_id: str, xp_earned: int):
    db = get_mongodb()
    completions = db['completions']
    stats = db['stats']
    
    # Record completion
    await completions.insert_one({
        "user_id": user_id,
        "task_id": task_id,
        "xp_earned": xp_earned,
        "completed_at": datetime.utcnow()
    })
    
    # Update stats
    await stats.update_one(
        {"user_id": user_id},
        {
            "$inc": {"total_xp": xp_earned, "tasks_completed": 1},
            "$set": {"updated_at": datetime.utcnow()}
        },
        upsert=True
    )
```

### 4. Get User Stats
```python
async def get_user_stats(user_id: str):
    db = get_mongodb()
    stats = db['stats']
    
    user_stats = await stats.find_one({"user_id": user_id})
    return user_stats
```

---

## 🔍 Verify Database

Run this command to check database status:
```bash
python3 -c "
from pymongo import MongoClient
client = MongoClient('mongodb+srv://dineshdg:Dinu%402003@cluster0.xrqr6fv.mongodb.net/consistency_app?retryWrites=true&w=majority&appName=Cluster0')
db = client.get_default_database()
print(f'Database: {db.name}')
print(f'Collections: {db.list_collection_names()}')
client.close()
"
```

---

## 🧪 Test Connection

```bash
cd backend
python3 init_mongodb.py
```

---

## 📊 Health Check

Start server and check MongoDB status:
```bash
uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/health/detailed
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "mongodb": "healthy"
  }
}
```

---

## 🗑️ Clean Up Initial Documents

To remove the initialization documents:
```python
from pymongo import MongoClient

MONGODB_URI = "mongodb+srv://dineshdg:Dinu%402003@cluster0.xrqr6fv.mongodb.net/consistency_app?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGODB_URI)
db = client.get_default_database()

# Remove init documents from all collections
for col_name in db.list_collection_names():
    db[col_name].delete_many({"_initialized": True})
    print(f"Cleaned {col_name}")

client.close()
```

---

## 🔐 Security Notes

- MongoDB URI contains credentials - keep `.env` file secure
- Never commit `.env` to git (already in `.gitignore`)
- Use environment variables in production
- Consider IP whitelisting in MongoDB Atlas

---

## 📚 Resources

- [Motor Documentation](https://motor.readthedocs.io/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [MongoDB Atlas](https://cloud.mongodb.com/)

---

**Status:** ✅ Ready for Development
