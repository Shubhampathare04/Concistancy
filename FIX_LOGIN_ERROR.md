# 🔧 FIX: Mobile App Login Error

## The Problem
Your backend is **NOT RUNNING**. That's why the mobile app shows "Cannot reach server".

---

## ✅ THE FIX (3 Steps)

### Step 1: Start Backend with Network Access

Open a terminal and run:

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**IMPORTANT:** Use `--host 0.0.0.0` (not just `--host localhost`)

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Keep this terminal open!**

---

### Step 2: Verify Backend is Working

Open a NEW terminal and test:

```bash
curl http://192.168.1.5:8000/health
```

Should return: `{"status":"ok","version":"2.0.0"}`

---

### Step 3: Test Login

```bash
curl -X POST http://192.168.1.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
```

Should return JSON with `access_token`.

If you get an error about user not found, create test users:

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
python3 seed_users.py
```

---

### Step 4: Test Mobile App

1. Make sure mobile app is running:
   ```bash
   cd /Users/dineshgaikwad/Desktop/consistency-app/mobile
   npx expo start --clear
   ```

2. Open Expo Go on your phone

3. Try logging in with:
   - Email: `alice@test.com`
   - Password: `password123`

---

## 🎯 Quick Verification

Run this to check everything:

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
bash check_connection.sh
```

Should show all ✅ green checkmarks.

---

## 📱 Test Users

After running `seed_users.py`, you'll have:

| Email | Password |
|-------|----------|
| alice@test.com | password123 |
| bob@test.com | password123 |
| charlie@test.com | password123 |

---

## 🔍 Still Having Issues?

### Issue: "Backend is NOT running on localhost"
**Fix:** Start the backend (Step 1 above)

### Issue: "Backend is NOT accessible from network"
**Fix:** Make sure you used `--host 0.0.0.0` when starting backend

### Issue: "Login failed - user not found"
**Fix:** Run `python3 seed_users.py` to create test users

### Issue: "Connection refused"
**Fix:** 
1. Check if port 8000 is free: `lsof -ti:8000`
2. If occupied, kill it: `lsof -ti:8000 | xargs kill -9`
3. Start backend again

---

## 📋 Complete Startup Sequence

```bash
# Terminal 1: Start MySQL
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
docker compose up -d

# Terminal 2: Start Backend
cd /Users/dineshgaikwad/Desktop/consistency-app/backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Terminal 3: Start Mobile App
cd /Users/dineshgaikwad/Desktop/consistency-app/mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

---

## ✅ Success Checklist

- [ ] Backend running with `--host 0.0.0.0`
- [ ] `curl http://192.168.1.5:8000/health` returns success
- [ ] Test users created with `seed_users.py`
- [ ] Mobile app started with `--clear`
- [ ] Phone and Mac on same WiFi
- [ ] Can login with alice@test.com / password123

---

**Start with Step 1 and work through each step. The backend MUST be running for the mobile app to work!**
