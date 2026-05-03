# Admin Credentials Setup Guide

## 🔐 Getting Admin Credentials

You have **3 options** to create admin credentials:

---

## Option 1: Auto-Generate Secure Credentials (Recommended)

This generates a cryptographically secure password automatically.

```bash
cd backend
python generate_admin_credentials.py
```

**Output:**
```
============================================================
✅ ADMIN USER CREATED SUCCESSFULLY!
============================================================

🔐 ADMIN CREDENTIALS (SAVE THESE SECURELY!)
------------------------------------------------------------
Email:    admin@consistency.com
Password: aB3$xY9#mK2@pL5!
Role:     super_admin
Name:     Super Admin
------------------------------------------------------------

📋 LOGIN INSTRUCTIONS:
1. Navigate to: http://localhost:3000/login
2. Enter the email and password above
3. Access the admin dashboard
============================================================
```

**✅ Advantages:**
- Secure random password (16 characters)
- No manual password creation needed
- Cryptographically secure

---

## Option 2: Custom Credentials via Environment Variables

Set your own email and password.

```bash
cd backend

# Set your credentials
export ADMIN_EMAIL=admin@consistency.com
export ADMIN_PASSWORD=YourSecurePassword123!
export ADMIN_NAME="Super Admin"
export ADMIN_ROLE=super_admin

# Create admin
python create_admin.py
```

**Output:**
```
✅ Admin user created successfully!
   ID: 1
   Email: admin@consistency.com
   Name: Super Admin
   Role: super_admin

🔐 Keep your credentials secure!
```

**✅ Advantages:**
- Full control over credentials
- Can use your preferred password
- Good for team environments

---

## Option 3: Create via Database Directly

For advanced users who want to create admin via SQL.

```sql
-- Connect to MySQL
mysql -u root -p consistency_db

-- Insert admin user (password: "admin123")
INSERT INTO admin_users (email, password_hash, name, role, is_active, created_at, updated_at)
VALUES (
    'admin@consistency.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqNkL6A9ZS',
    'Super Admin',
    'super_admin',
    1,
    NOW(),
    NOW()
);
```

**⚠️ Note:** The password hash above is for "admin123" - change it immediately after login!

---

## 🎯 Quick Start (Recommended Path)

### Step 1: Generate Credentials
```bash
cd backend
python generate_admin_credentials.py
```

### Step 2: Save Credentials
Copy the displayed email and password to a secure location (password manager).

### Step 3: Start Backend
```bash
uvicorn app.main:app --reload --port 8000
```

### Step 4: Start Frontend
```bash
cd ../admin-panel
npm install
npm run dev
```

### Step 5: Login
1. Open http://localhost:3000/login
2. Enter the generated credentials
3. Access the dashboard

---

## 📝 Default Credentials (If Using Option 1)

After running `generate_admin_credentials.py`, you'll get:

- **Email:** admin@consistency.com
- **Password:** (randomly generated, 16 characters)
- **Role:** super_admin
- **Access:** Full system access

---

## 🔄 Creating Additional Admins

### Create an Admin (limited permissions)
```bash
export ADMIN_EMAIL=manager@consistency.com
export ADMIN_PASSWORD=SecurePass456!
export ADMIN_ROLE=admin
python create_admin.py
```

### Create an Analyst (read-only)
```bash
export ADMIN_EMAIL=analyst@consistency.com
export ADMIN_PASSWORD=SecurePass789!
export ADMIN_ROLE=analyst
python create_admin.py
```

---

## 🔐 Role Permissions

### super_admin
- ✅ Full system access
- ✅ Delete users
- ✅ Manage all resources
- ✅ Create/update subscriptions
- ✅ View all analytics

### admin
- ✅ User management (ban/unban/update)
- ✅ Subscription management
- ✅ View analytics
- ❌ Cannot delete users

### analyst
- ✅ View analytics
- ✅ View users, tasks, subscriptions
- ❌ Cannot modify any data
- ❌ Read-only access

---

## 🔒 Security Best Practices

### ✅ DO:
- Use strong passwords (16+ characters)
- Store credentials in password manager
- Use environment variables in production
- Rotate passwords regularly
- Enable 2FA (when available)
- Use HTTPS in production

### ❌ DON'T:
- Hardcode credentials in code
- Commit credentials to Git
- Share credentials via email/chat
- Use simple passwords
- Reuse passwords
- Store in plain text files

---

## 🐛 Troubleshooting

### Issue: "Admin already exists"
**Solution:**
```bash
# Option 1: Update existing admin
mysql -u root -p consistency_db
DELETE FROM admin_users WHERE email = 'admin@consistency.com';
exit

# Then run generate script again
python generate_admin_credentials.py

# Option 2: Use different email
export ADMIN_EMAIL=admin2@consistency.com
python create_admin.py
```

### Issue: "Cannot connect to database"
**Solution:**
```bash
# Check if MySQL is running
docker ps

# Start MySQL if needed
cd backend
docker compose up -d

# Verify connection
mysql -u root -p -h localhost -P 3306
```

### Issue: "Login fails with correct credentials"
**Solution:**
```bash
# Verify admin exists
mysql -u root -p consistency_db
SELECT id, email, role, is_active FROM admin_users;

# Check if active
UPDATE admin_users SET is_active = 1 WHERE email = 'admin@consistency.com';

# Verify JWT_SECRET is set
cat backend/.env | grep JWT_SECRET
```

### Issue: "Permission denied"
**Solution:**
- Check admin role in database
- Verify JWT token is valid
- Check RBAC middleware logs

---

## 📊 Verify Admin Creation

### Via MySQL
```sql
mysql -u root -p consistency_db

SELECT 
    id, 
    email, 
    name, 
    role, 
    is_active, 
    created_at 
FROM admin_users;
```

### Via API
```bash
# Login
curl -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@consistency.com","password":"YOUR_PASSWORD"}'

# Response should include access_token
```

### Via Admin Panel
1. Open http://localhost:3000/login
2. Enter credentials
3. Should redirect to dashboard

---

## 🔄 Reset Password

### Method 1: Recreate Admin
```bash
# Delete existing
mysql -u root -p consistency_db
DELETE FROM admin_users WHERE email = 'admin@consistency.com';
exit

# Create new
python generate_admin_credentials.py
```

### Method 2: Update Password Hash
```bash
# Generate new hash
python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('NewPassword123!'))"

# Update in database
mysql -u root -p consistency_db
UPDATE admin_users 
SET password_hash = 'PASTE_HASH_HERE' 
WHERE email = 'admin@consistency.com';
```

---

## 📞 Support

If you encounter issues:

1. Check `ADMIN_PANEL_GUIDE.md` for detailed setup
2. Verify database is running: `docker ps`
3. Check backend logs for errors
4. Verify environment variables are set
5. Review API docs: http://localhost:8000/docs

---

## 🎯 Production Deployment

### Environment Variables (Production)
```bash
# Never use default credentials in production!
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=$(openssl rand -base64 32)
export ADMIN_ROLE=super_admin

python create_admin.py
```

### Security Checklist
- [ ] Strong unique password
- [ ] HTTPS enabled
- [ ] JWT_SECRET is random and secure
- [ ] Database credentials secured
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Audit logging active
- [ ] Backup strategy in place

---

## 📝 Summary

**Recommended for Development:**
```bash
python generate_admin_credentials.py
```

**Recommended for Production:**
```bash
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=$(openssl rand -base64 32)
python create_admin.py
```

**Default Login URL:**
```
http://localhost:3000/login
```

**Save your credentials securely and never commit them to Git!**
