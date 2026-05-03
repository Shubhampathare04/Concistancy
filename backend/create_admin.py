#!/usr/bin/env python3
"""
Create admin user securely from environment variables.
Usage: python create_admin.py
"""
import os
import sys
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import AdminUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME", "Super Admin")
    role = os.getenv("ADMIN_ROLE", "super_admin")
    
    if not email or not password:
        print("❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required")
        print("\nUsage:")
        print("  export ADMIN_EMAIL=admin@example.com")
        print("  export ADMIN_PASSWORD=your_secure_password")
        print("  export ADMIN_NAME='Admin Name'  # Optional")
        print("  export ADMIN_ROLE=super_admin   # Optional: super_admin|admin|analyst")
        print("  python create_admin.py")
        sys.exit(1)
    
    if role not in ["super_admin", "admin", "analyst"]:
        print(f"❌ Error: Invalid role '{role}'. Must be: super_admin, admin, or analyst")
        sys.exit(1)
    
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing = db.query(AdminUser).filter(AdminUser.email == email).first()
        if existing:
            print(f"⚠️  Admin user with email '{email}' already exists")
            update = input("Update password? (y/n): ").lower()
            if update == 'y':
                existing.password_hash = pwd_context.hash(password)
                existing.name = name
                existing.role = role
                existing.is_active = True
                db.commit()
                print(f"✅ Admin user '{email}' updated successfully")
            else:
                print("❌ Operation cancelled")
            return
        
        # Create new admin
        password_hash = pwd_context.hash(password)
        admin = AdminUser(
            email=email,
            password_hash=password_hash,
            name=name,
            role=role,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"   ID: {admin.id}")
        print(f"   Email: {admin.email}")
        print(f"   Name: {admin.name}")
        print(f"   Role: {admin.role}")
        print("\n🔐 Keep your credentials secure!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
