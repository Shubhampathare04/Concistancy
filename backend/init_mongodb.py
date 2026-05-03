from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime

MONGODB_URI = "mongodb+srv://dineshdg:Dinu%402003@cluster0.xrqr6fv.mongodb.net/consistency_app?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGODB_URI)
db = client.get_default_database()

print(f"🔗 Connected to database: {db.name}")
print(f"📋 Existing collections: {db.list_collection_names()}\n")

# Drop test collection
if 'test_collection' in db.list_collection_names():
    db['test_collection'].drop()
    print("🗑️  Dropped test_collection")

# Define collections with their indexes
collections_config = {
    'users': [
        ('email', ASCENDING, {'unique': True}),
        ('created_at', DESCENDING, {}),
    ],
    'tasks': [
        ('user_id', ASCENDING, {}),
        ('created_at', DESCENDING, {}),
        ('status', ASCENDING, {}),
    ],
    'habits': [
        ('user_id', ASCENDING, {}),
        ('created_at', DESCENDING, {}),
    ],
    'completions': [
        ('user_id', ASCENDING, {}),
        ('task_id', ASCENDING, {}),
        ('completed_at', DESCENDING, {}),
    ],
    'stats': [
        ('user_id', ASCENDING, {'unique': True}),
        ('updated_at', DESCENDING, {}),
    ],
    'streaks': [
        ('user_id', ASCENDING, {}),
        ('task_id', ASCENDING, {}),
    ],
    'notifications': [
        ('user_id', ASCENDING, {}),
        ('created_at', DESCENDING, {}),
        ('read', ASCENDING, {}),
    ],
    'sync_queue': [
        ('user_id', ASCENDING, {}),
        ('created_at', ASCENDING, {}),
        ('synced', ASCENDING, {}),
    ],
}

print("📦 Creating collections and indexes...\n")

for collection_name, indexes in collections_config.items():
    collection = db[collection_name]
    
    # Insert initial document to create collection
    if collection.count_documents({}) == 0:
        collection.insert_one({
            '_initialized': True,
            'created_at': datetime.utcnow(),
            'note': 'Initial document - can be deleted'
        })
    
    # Create indexes
    for idx in indexes:
        field, order, options = idx
        index_name = collection.create_index([(field, order)], **options)
        print(f"  ✅ {collection_name}.{field} -> {index_name}")

print(f"\n📋 Final collections in '{db.name}':")
for col in db.list_collection_names():
    count = db[col].count_documents({})
    print(f"  - {col} ({count} documents)")

print(f"\n🎉 MongoDB database '{db.name}' is fully initialized!")

client.close()
