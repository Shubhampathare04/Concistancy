# 🚀 COMPLETE STARTUP GUIDE - FINAL

## Your Setup
- **MySQL**: For user data, tasks, subscriptions (PRIMARY DATABASE)
- **MongoDB**: For logs, events, analytics (SECONDARY)
- **Redis**: For caching
- **Backend**: FastAPI on port 8000
- **Mobile**: React Native Expo
- **Admin Panel**: React on port 3000

---

## ✅ STEP-BY-STEP STARTUP

### Step 1: Start MySQL & Redis

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
docker compose up -d
```

**Verify:**
```bash
docker ps
```

Should show `consistency_mysql` and `consistency_redis` running.

---

### Step 2: Start Backend

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**IMPORTANT:** Use `--host 0.0.0.0` for mobile access!

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Keep this terminal open!**

---

### Step 3: Verify Backend Works

Open a NEW terminal:

```bash
# Test health
curl http://192.168.1.5:8000/health

# Should return: {"status":"ok","version":"2.0.0"}
```

---

### Step 4: Test Login

```bash
curl -X POST http://192.168.1.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
```

**Should return JSON with `access_token`**

If you get an error, check the backend terminal for logs.

---

### Step 5: Start Mobile App

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

---

### Step 6: Login on Phone

1. Open Expo Go app
2. Scan QR code
3. Login with:
   - Email: `alice@test.com`
   - Password: `password123`

---

## 🎯 WHAT'S RUNNING

| Service | Port | Status | Command |
|---------|------|--------|---------|
| MySQL | 3306 | ✅ Running | `docker compose up -d` |
| Redis | 6379 | ✅ Running | `docker compose up -d` |
| MongoDB | Cloud | ✅ Atlas | Already configured |
| Backend | 8000 | ⚠️ Start | `uvicorn app.main:app --reload --port 8000 --host 0.0.0.0` |
| Mobile | 8082 | ⚠️ Start | `npx expo start --clear` |
| Admin | 3000 | Optional | `npm run dev` |

---

## 🔍 TROUBLESHOOTING

### Error: "Connection refused" (MySQL)
```bash
# Start MySQL
cd backend
docker compose up -d

# Wait 5 seconds
sleep 5

# Verify
docker ps | grep mysql
```

### Error: "Internal Server Error" on login
Check backend terminal for actual error. Common causes:
1. MySQL not running → `docker compose up -d`
2. User doesn't exist → `python3 seed_users.py`
3. Database not migrated → `alembic upgrade head`

### Error: "Cannot reach server" (Mobile)
1. Backend must use `--host 0.0.0.0`
2. Test: `curl http://192.168.1.5:8000/health`
3. Phone and Mac on same WiFi

---

## 📱 TEST CREDENTIALS

### Mobile App Users
| Email | Password |
|-------|----------|
| alice@test.com | password123 |
| bob@test.com | password123 |
| charlie@test.com | password123 |

### Admin Panel
| Email | Password |
|-------|----------|
| admin@consistency.com | Ey9ij5cDoTbEQ^pR |

---

## 🔧 QUICK COMMANDS

### Check Everything
```bash
# MySQL running?
docker ps | grep mysql

# Backend running?
curl http://localhost:8000/health

# Backend accessible from network?
curl http://192.168.1.5:8000/health

# Test login?
curl -X POST http://192.168.1.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
```

### Restart Everything
```bash
# Stop backend (Ctrl+C in backend terminal)

# Restart MySQL
cd backend
docker compose restart

# Start backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Restart mobile (in mobile terminal)
# Ctrl+C then:
npx expo start --clear
```

---

## 📋 STARTUP CHECKLIST

- [ ] MySQL running: `docker ps | grep mysql`
- [ ] Backend started with `--host 0.0.0.0`
- [ ] Backend health check works: `curl http://192.168.1.5:8000/health`
- [ ] Login test works (returns access_token)
- [ ] Mobile app started with `--clear`
- [ ] Phone and Mac on same WiFi
- [ ] Can login on mobile app

---

## 🎊 SUCCESS INDICATORS

### Backend Terminal
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Health Check
```bash
curl http://192.168.1.5:8000/health
# Returns: {"status":"ok","version":"2.0.0"}
```

### Login Test
```bash
curl -X POST http://192.168.1.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
# Returns: {"access_token":"...", "user":{...}}
```

### Mobile App
- Loads without errors
- Login screen appears
- Can enter credentials
- Login succeeds → redirects to home

---

## 📞 IF STILL NOT WORKING

1. **Check backend terminal** for error messages
2. **Run:** `cd backend && bash check_connection.sh`
3. **Verify:** All services running with `docker ps`
4. **Test:** Each step individually
5. **Share:** Backend error logs if still failing

---

## 🎯 YOUR CURRENT STATUS

✅ MySQL: Running  
✅ Redis: Running  
✅ MongoDB: Atlas (cloud)  
✅ Test users: Created  
✅ Admin user: Created  
⚠️ Backend: Need to start with `--host 0.0.0.0`  
⚠️ Mobile: Need to test login  

---

**Start the backend now and test login!**
