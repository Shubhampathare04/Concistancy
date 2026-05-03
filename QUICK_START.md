# 🚀 QUICK START GUIDE - All Systems

This guide shows you how to start ALL parts of the Consistency app correctly.

---

## 📋 PREREQUISITES

- ✅ MySQL running: `docker compose up -d` (in backend folder)
- ✅ Database migrated: `alembic upgrade head` (in backend folder)
- ✅ Admin user created: `python3 generate_admin_credentials.py` (in backend folder)

---

## 🎯 START EVERYTHING

### Option 1: Use Startup Script (Recommended)

```bash
# Terminal 1: Backend
cd backend
./start_backend.sh
```

### Option 2: Manual Commands

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**⚠️ IMPORTANT:** Use `--host 0.0.0.0` so mobile app can connect!

---

## 📱 START MOBILE APP

```bash
# Terminal 2: Mobile App
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

**Replace `192.168.1.5` with your Mac's IP if different**

To find your IP:
```bash
ipconfig getifaddr en0
```

---

## 💻 START ADMIN PANEL

```bash
# Terminal 3: Admin Panel
cd admin-panel
npm run dev
```

---

## 🔗 ACCESS URLS

| Service | URL | Credentials |
|---------|-----|-------------|
| **Mobile App** | Expo Go on phone | Test users: alice@test.com / password123 |
| **Admin Panel** | http://localhost:3000 | admin@consistency.com / Ey9ij5cDoTbEQ^pR |
| **Backend API** | http://localhost:8000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **Health Check** | http://localhost:8000/health | - |

---

## ✅ VERIFICATION

### 1. Check Backend is Running

```bash
# Should return: {"status":"ok","version":"2.0.0"}
curl http://localhost:8000/health

# Should also work from network IP
curl http://192.168.1.5:8000/health
```

### 2. Check Mobile App Connects

- Open Expo Go on phone
- Scan QR code
- App should load without "Cannot reach server" error

### 3. Check Admin Panel

- Open http://localhost:3000
- Should see login page
- Login with admin credentials

---

## 🐛 TROUBLESHOOTING

### Mobile App: "Cannot reach server"

**Problem:** Backend not accessible from network

**Fix:**
```bash
# Stop backend (Ctrl+C)
# Restart with --host 0.0.0.0
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Verify:**
```bash
curl http://192.168.1.5:8000/health
# Should return: {"status":"ok","version":"2.0.0"}
```

### Mobile App: Wrong IP

**Problem:** IP address changed

**Fix:**
```bash
# Get current IP
ipconfig getifaddr en0

# Update mobile/.env
cd mobile
nano .env
# Change to: EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api/v1

# Restart mobile app
npx expo start --clear
```

### Backend: Port Already in Use

**Problem:** Port 8000 is occupied

**Fix:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Start backend again
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Admin Panel: Can't Login

**Problem:** Admin user doesn't exist

**Fix:**
```bash
cd backend
python3 generate_admin_credentials.py
# Save the displayed credentials
```

---

## 📱 TEST USERS (Mobile App)

If you need test users for the mobile app:

```bash
cd backend
python3 seed_users.py
```

**Test Users:**
- Email: `alice@test.com` / Password: `password123`
- Email: `bob@test.com` / Password: `password123`
- Email: `charlie@test.com` / Password: `password123`

---

## 🎯 TYPICAL WORKFLOW

### Development Day Start

```bash
# 1. Start MySQL (if not running)
cd backend
docker compose up -d

# 2. Start Backend
./start_backend.sh
# OR
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# 3. Start Mobile App (new terminal)
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan

# 4. Start Admin Panel (new terminal, optional)
cd admin-panel
npm run dev
```

### Development Day End

```bash
# Stop all with Ctrl+C in each terminal

# Optional: Stop MySQL
cd backend
docker compose down
```

---

## 🔧 COMMON COMMANDS

### Backend

```bash
# Start backend (network accessible)
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Run migrations
alembic upgrade head

# Create admin user
python3 generate_admin_credentials.py

# Seed test users
python3 seed_users.py

# Check health
curl http://localhost:8000/health
```

### Mobile App

```bash
# Start with clear cache
npx expo start --clear

# Start with LAN mode
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --lan

# Install dependencies
npm install
```

### Admin Panel

```bash
# Start dev server
npm run dev

# Install dependencies
npm install

# Build for production
npm run build
```

### Database

```bash
# Start MySQL + Redis
docker compose up -d

# Stop MySQL + Redis
docker compose down

# View logs
docker compose logs -f

# Connect to MySQL
mysql -u root -p -h localhost -P 3306 consistency_db
```

---

## 📊 SYSTEM STATUS CHECK

Run this to check everything:

```bash
# Backend
curl http://localhost:8000/health

# MySQL
docker ps | grep mysql

# Redis
docker ps | grep redis

# Get Mac IP
ipconfig getifaddr en0
```

---

## 🎊 SUCCESS INDICATORS

When everything is working:

1. **Backend Terminal:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete.
   ```

2. **Mobile App Terminal:**
   ```
   Metro waiting on exp://192.168.1.5:8082
   ```

3. **Admin Panel Terminal:**
   ```
   VITE ready in XXX ms
   Local: http://localhost:3000
   ```

4. **Health Check:**
   ```bash
   curl http://localhost:8000/health
   # Returns: {"status":"ok","version":"2.0.0"}
   ```

5. **Mobile App:**
   - Loads without errors
   - Can login with test users
   - Can see dashboard

6. **Admin Panel:**
   - Loads at localhost:3000
   - Can login with admin credentials
   - Dashboard shows data

---

## 📞 NEED HELP?

See detailed troubleshooting:
- **Mobile Connection Issues:** `MOBILE_CONNECTION_FIX.md`
- **Admin Panel Setup:** `ADMIN_SETUP_FINAL.md`
- **Full Documentation:** `README.md`

---

## 🎯 QUICK REFERENCE

**Your Mac IP:** `192.168.1.5`

**Backend Command:**
```bash
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Mobile Command:**
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

**Admin Credentials:**
```
Email: admin@consistency.com
Password: Ey9ij5cDoTbEQ^pR
```

**Test User:**
```
Email: alice@test.com
Password: password123
```

---

**🚀 You're all set! Start the services and begin developing!**
