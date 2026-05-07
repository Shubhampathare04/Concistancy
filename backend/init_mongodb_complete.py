"""
MongoDB Collections Initialization Script
Creates all required collections with proper schemas and indexes
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

def init_mongodb():
    """Initialize MongoDB collections with schemas and indexes"""
    
    client = MongoClient(MONGODB_URI)
    db = client.consistency_app
    
    print("Initializing MongoDB collections...")
    
    # Core Collections
    collections = {
        "users": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "email", "created_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "email": {"bsonType": "string"},
                        "name": {"bsonType": "string"},
                        "avatar_url": {"bsonType": ["string", "null"]},
                        "bio": {"bsonType": ["string", "null"]},
                        "timezone": {"bsonType": "string"},
                        "preferences": {"bsonType": "object"},
                        "created_at": {"bsonType": "date"},
                        "updated_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("email", ASCENDING)
            ]
        },
        
        "tasks": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["task_id", "user_id", "title", "created_at"],
                    "properties": {
                        "task_id": {"bsonType": "int"},
                        "user_id": {"bsonType": "int"},
                        "title": {"bsonType": "string"},
                        "description": {"bsonType": ["string", "null"]},
                        "difficulty": {"bsonType": "int", "minimum": 1, "maximum": 5},
                        "category": {"bsonType": "string"},
                        "estimated_minutes": {"bsonType": "int"},
                        "schedule_type": {"bsonType": "string"},
                        "is_active": {"bsonType": "bool"},
                        "tags": {"bsonType": "array"},
                        "created_at": {"bsonType": "date"},
                        "updated_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("task_id", ASCENDING),
                ("user_id", ASCENDING),
                ("is_active", ASCENDING),
                ("category", ASCENDING)
            ]
        },
        
        "completions": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["completion_id", "task_id", "user_id", "completed_at"],
                    "properties": {
                        "completion_id": {"bsonType": "int"},
                        "task_id": {"bsonType": "int"},
                        "user_id": {"bsonType": "int"},
                        "completed_at": {"bsonType": "date"},
                        "duration_minutes": {"bsonType": ["int", "null"]},
                        "xp_earned": {"bsonType": "int"},
                        "proof_url": {"bsonType": ["string", "null"]},
                        "notes": {"bsonType": ["string", "null"]},
                        "mood": {"bsonType": ["string", "null"]}
                    }
                }
            },
            "indexes": [
                ("completion_id", ASCENDING),
                ("task_id", ASCENDING),
                ("user_id", ASCENDING),
                ("completed_at", DESCENDING)
            ]
        },
        
        "streaks": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "current_streak", "longest_streak"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "current_streak": {"bsonType": "int"},
                        "longest_streak": {"bsonType": "int"},
                        "last_completed_date": {"bsonType": ["date", "null"]},
                        "streak_history": {"bsonType": "array"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING)
            ]
        },
        
        "stats": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "xp", "level"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "xp": {"bsonType": "int"},
                        "level": {"bsonType": "int"},
                        "coins": {"bsonType": "int"},
                        "total_completions": {"bsonType": "int"},
                        "consistency_index": {"bsonType": "double"},
                        "updated_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("level", DESCENDING),
                ("xp", DESCENDING)
            ]
        },
        
        "notifications": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "type", "created_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "type": {"bsonType": "string"},
                        "title": {"bsonType": "string"},
                        "message": {"bsonType": "string"},
                        "data": {"bsonType": "object"},
                        "is_read": {"bsonType": "bool"},
                        "created_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("is_read", ASCENDING),
                ("created_at", DESCENDING)
            ]
        },
        
        "sync_queue": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "action_type", "payload", "status"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "action_type": {"bsonType": "string"},
                        "payload": {"bsonType": "object"},
                        "status": {"bsonType": "string"},
                        "retry_count": {"bsonType": "int"},
                        "created_at": {"bsonType": "date"},
                        "processed_at": {"bsonType": ["date", "null"]}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("status", ASCENDING),
                ("created_at", ASCENDING)
            ]
        },
        
        # Social Collections
        "connections": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "connected_user_id", "status", "created_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "connected_user_id": {"bsonType": "int"},
                        "status": {"bsonType": "string"},
                        "created_at": {"bsonType": "date"},
                        "accepted_at": {"bsonType": ["date", "null"]}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("connected_user_id", ASCENDING),
                ("status", ASCENDING)
            ]
        },
        
        "groups": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["group_id", "name", "created_by", "created_at"],
                    "properties": {
                        "group_id": {"bsonType": "int"},
                        "name": {"bsonType": "string"},
                        "description": {"bsonType": ["string", "null"]},
                        "avatar_url": {"bsonType": ["string", "null"]},
                        "created_by": {"bsonType": "int"},
                        "is_private": {"bsonType": "bool"},
                        "member_count": {"bsonType": "int"},
                        "created_at": {"bsonType": "date"},
                        "updated_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("group_id", ASCENDING),
                ("created_by", ASCENDING),
                ("is_private", ASCENDING)
            ]
        },
        
        "group_members": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["group_id", "user_id", "role", "joined_at"],
                    "properties": {
                        "group_id": {"bsonType": "int"},
                        "user_id": {"bsonType": "int"},
                        "role": {"bsonType": "string"},
                        "joined_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("group_id", ASCENDING),
                ("user_id", ASCENDING)
            ]
        },
        
        "group_challenges": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["challenge_id", "group_id", "title", "created_by", "start_date", "end_date"],
                    "properties": {
                        "challenge_id": {"bsonType": "int"},
                        "group_id": {"bsonType": "int"},
                        "title": {"bsonType": "string"},
                        "description": {"bsonType": ["string", "null"]},
                        "goal_type": {"bsonType": "string"},
                        "goal_value": {"bsonType": "int"},
                        "created_by": {"bsonType": "int"},
                        "start_date": {"bsonType": "date"},
                        "end_date": {"bsonType": "date"},
                        "participant_count": {"bsonType": "int"},
                        "created_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("challenge_id", ASCENDING),
                ("group_id", ASCENDING),
                ("start_date", ASCENDING),
                ("end_date", ASCENDING)
            ]
        },
        
        "challenge_participants": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["challenge_id", "user_id", "joined_at"],
                    "properties": {
                        "challenge_id": {"bsonType": "int"},
                        "user_id": {"bsonType": "int"},
                        "progress": {"bsonType": "int"},
                        "completed": {"bsonType": "bool"},
                        "joined_at": {"bsonType": "date"},
                        "completed_at": {"bsonType": ["date", "null"]}
                    }
                }
            },
            "indexes": [
                ("challenge_id", ASCENDING),
                ("user_id", ASCENDING)
            ]
        },
        
        "activity_feed": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "activity_type", "created_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "activity_type": {"bsonType": "string"},
                        "data": {"bsonType": "object"},
                        "visibility": {"bsonType": "string"},
                        "created_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("created_at", DESCENDING),
                ("visibility", ASCENDING)
            ]
        },
        
        "messages": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["group_id", "user_id", "content", "created_at"],
                    "properties": {
                        "group_id": {"bsonType": "int"},
                        "user_id": {"bsonType": "int"},
                        "content": {"bsonType": "string"},
                        "attachments": {"bsonType": "array"},
                        "created_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("group_id", ASCENDING),
                ("created_at", DESCENDING)
            ]
        },
        
        # AI Collections
        "behavior_scores": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "task_id", "computed_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "task_id": {"bsonType": "int"},
                        "success_rate": {"bsonType": "double"},
                        "avg_completion_hour": {"bsonType": ["int", "null"]},
                        "avg_duration_minutes": {"bsonType": ["double", "null"]},
                        "predicted_success_prob": {"bsonType": "double"},
                        "recommended_difficulty": {"bsonType": "int"},
                        "computed_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("task_id", ASCENDING),
                ("computed_at", DESCENDING)
            ]
        },
        
        "insights": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "type", "message", "priority", "created_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "type": {"bsonType": "string"},
                        "message": {"bsonType": "string"},
                        "priority": {"bsonType": "int"},
                        "data": {"bsonType": "object"},
                        "is_read": {"bsonType": "bool"},
                        "created_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("priority", DESCENDING),
                ("is_read", ASCENDING),
                ("created_at", DESCENDING)
            ]
        },
        
        "achievements": {
            "validator": {
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["user_id", "achievement_type", "unlocked_at"],
                    "properties": {
                        "user_id": {"bsonType": "int"},
                        "achievement_type": {"bsonType": "string"},
                        "title": {"bsonType": "string"},
                        "description": {"bsonType": "string"},
                        "icon": {"bsonType": "string"},
                        "xp_reward": {"bsonType": "int"},
                        "unlocked_at": {"bsonType": "date"}
                    }
                }
            },
            "indexes": [
                ("user_id", ASCENDING),
                ("achievement_type", ASCENDING),
                ("unlocked_at", DESCENDING)
            ]
        }
    }
    
    # Create collections with validators and indexes
    for collection_name, config in collections.items():
        if collection_name in db.list_collection_names():
            print(f"Collection '{collection_name}' already exists, skipping...")
            continue
            
        db.create_collection(
            collection_name,
            validator=config["validator"]
        )
        
        # Create indexes
        collection = db[collection_name]
        for index in config["indexes"]:
            if isinstance(index, tuple):
                collection.create_index([index])
            else:
                collection.create_index(index)
        
        print(f"Created collection: {collection_name}")
    
    print("\nMongoDB initialization complete!")
    print(f"Total collections: {len(collections)}")
    
    client.close()

if __name__ == "__main__":
    init_mongodb()
