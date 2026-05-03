#!/usr/bin/env python3
"""
Generate secure admin credentials for initial setup.
This script creates a super admin user with a randomly generated password.
"""
import os
import secrets
import string
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.models import AdminUser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_secure_password(length=16):
    """Generate a cryptographically secure password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def create_default_admin():
    """Create default admin user with secure credentials."""
    
    # Default credentials
    email = "admin@consistency.com"
    password = generate_secure_password(16)
    name = "Super Admin"
    role = "super_admin"
    
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing = db.query(AdminUser).filter(AdminUser.email == email).first()
        
        if existing:
            print("=" * 60)
            print("⚠️  ADMIN USER ALREADY EXISTS")
            print("=" * 60)
            print(f"Email: {existing.email}")
            print(f"Role: {existing.role}")
            print(f"Created: {existing.created_at}")
            print("\nTo reset password, delete the user and run this script again.")
            print("Or use create_admin.py with custom credentials.")
            print("=" * 60)
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
        
        # Display credentials
        print("\n" + "=" * 60)
        print("✅ ADMIN USER CREATED SUCCESSFULLY!")
        print("=" * 60)
        print("\n🔐 ADMIN CREDENTIALS (SAVE THESE SECURELY!)")
        print("-" * 60)
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print(f"Role:     {role}")
        print(f"Name:     {name}")
        print("-" * 60)
        print("\n📋 LOGIN INSTRUCTIONS:")
        print("1. Navigate to: http://localhost:3000/login")
        print("2. Enter the email and password above")
        print("3. Access the admin dashboard")
        print("\n⚠️  IMPORTANT SECURITY NOTES:")
        print("- Save these credentials in a secure password manager")
        print("- Change the password after first login (future feature)")
        print("- Never commit credentials to version control")
        print("- Use environment variables in production")
        print("\n🔗 USEFUL LINKS:")
        print("- Admin Panel: http://localhost:3000")
        print("- API Docs: http://localhost:8000/docs")
        print("- Health Check: http://localhost:8000/health")
        print("=" * 60)
        print("\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🚀 Consistency Admin - Credential Generator")
    print("=" * 60)
    create_default_admin()
