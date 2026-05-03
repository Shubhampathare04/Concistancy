from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
MONGODB_URI = "mongodb+srv://dineshdg:Dinu%402003@cluster0.xrqr6fv.mongodb.net/consistency_app?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGODB_URI)

# Get database
db = client.get_default_database()

print(f"✅ Connected to MongoDB")
print(f"📦 Database: {db.name}")

# Create a test collection and insert a document
test_collection = db['test_collection']
test_doc = {
    "message": "Hello from Consistency App!",
    "created_at": datetime.utcnow(),
    "version": "1.0"
}

result = test_collection.insert_one(test_doc)
print(f"✅ Inserted test document with ID: {result.inserted_id}")

# List all collections
collections = db.list_collection_names()
print(f"📋 Collections in database: {collections}")

# Read back the document
doc = test_collection.find_one({"_id": result.inserted_id})
print(f"📄 Retrieved document: {doc}")

print(f"\n🎉 MongoDB database '{db.name}' is ready!")
client.close()
