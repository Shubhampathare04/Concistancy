"""
Run: python seed_users.py
Creates test users for development login.
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.models import User, Streak, UserStats
from app.core.security import hash_password

TEST_USERS = [
    {"email": "alice@test.com",   "password": "password123", "name": "Alice",   "goal": "Build daily workout habit"},
    {"email": "bob@test.com",     "password": "password123", "name": "Bob",     "goal": "Read 30 minutes every day"},
    {"email": "charlie@test.com", "password": "password123", "name": "Charlie", "goal": "Learn a new skill weekly"},
]

def seed():
    db = SessionLocal()
    try:
        for u in TEST_USERS:
            if db.query(User).filter(User.email == u["email"]).first():
                print(f"  skip  {u['email']} (already exists)")
                continue
            user = User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                name=u["name"],
                goal=u["goal"],
            )
            db.add(user)
            db.flush()
            db.add(Streak(user_id=user.id))
            db.add(UserStats(user_id=user.id))
            db.commit()
            print(f"  created {u['email']}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
    print("\nTest credentials (all passwords: password123)")
    print("-" * 40)
    for u in TEST_USERS:
        print(f"  email: {u['email']}")
