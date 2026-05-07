# QUICK START GUIDE — Next 24 Hours

> What to do RIGHT NOW to launch in 4-5 days

---

## ⚡ IMMEDIATE ACTIONS (Next 2 Hours)

### 1. Run Database Migration (5 min)
```bash
cd backend
alembic upgrade head
```
**Why:** Adds performance indexes to database

### 2. Install Sentry SDK (2 min)
```bash
cd backend
pip install sentry-sdk[fastapi]==2.0.0
```

### 3. Setup Sentry (15 min)
1. Go to https://sentry.io
2. Sign up (free tier is fine)
3. Create new project → Select "FastAPI"
4. Copy DSN
5. Add to `backend/.env`:
   ```
   SENTRY_DSN=your_dsn_here
   ENVIRONMENT=development
   ```
6. Restart backend

### 4. Test Backend (5 min)
```bash
# Health check
curl http://localhost:8000/health/detailed

# Should show: database, redis, mongodb all "healthy"
```

### 5. Start Manual Testing (1-2 hours)
Open `COMPREHENSIVE_TEST_CHECKLIST.md` and start with:
- Test Suite 1: Authentication (15 min)
- Test Suite 2: Task Management (30 min)
- Test Suite 3: Streaks & XP (20 min)

---

## 📱 FIREBASE SETUP (Next 1 Hour)

### Step 1: Create Firebase Project (10 min)
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "Consistency App"
4. Disable Google Analytics
5. Click "Create project"

### Step 2: Add Android App (15 min)
1. Click "Add app" → Android
2. Package name: `com.anonymous.mobile`
3. Download `google-services.json`
4. Place in `mobile/` directory
5. Click "Next" → "Continue to console"

### Step 3: Add iOS App (15 min)
1. Click "Add app" → iOS
2. Bundle ID: `com.anonymous.mobile`
3. Download `GoogleService-Info.plist`
4. Place in `mobile/` directory
5. Click "Next" → "Continue to console"

### Step 4: Get FCM Server Key (10 min)
1. Go to Project Settings (gear icon)
2. Go to "Cloud Messaging" tab
3. Enable "Cloud Messaging API (Legacy)"
4. Copy "Server key"
5. Add to `backend/.env`:
   ```
   FCM_SERVER_KEY=your_server_key_here
   ```
6. Restart backend

### Step 5: Test Notifications (10 min)
1. Open app on physical device
2. Login
3. Check console for: "✅ Push token registered"
4. Test notification:
   ```bash
   curl -X POST http://localhost:8000/api/v1/notifications/test \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test", "body": "Test notification"}'
   ```

---

## 🧪 TESTING PRIORITY (Next 4 Hours)

### Critical Tests (Must Pass)
1. ✅ User registration & login
2. ✅ Create task
3. ✅ Complete task → See XP gain
4. ✅ Streak updates correctly
5. ✅ Offline sync works
6. ✅ Push notifications received
7. ✅ Social features work
8. ✅ Theme switching works

### Test Order
1. **Authentication** (15 min) - Register, login, logout
2. **Task Management** (30 min) - Create, complete, sync
3. **Streaks & XP** (20 min) - Verify calculations
4. **Offline Sync** (30 min) - Go offline, sync when online
5. **Social Features** (45 min) - Connections, groups, chat
6. **Push Notifications** (30 min) - Test all notification types
7. **Error Handling** (20 min) - Network errors, invalid data
8. **Performance** (15 min) - Load time, scrolling, caching

---

## 📝 TOMORROW'S TASKS

### Morning (4 hours)
- [ ] Complete remaining manual tests
- [ ] Document all bugs found
- [ ] Fix critical bugs
- [ ] Re-test fixed bugs

### Afternoon (4 hours)
- [ ] Create app screenshots (5-8 per platform)
- [ ] Design app icon (1024x1024)
- [ ] Write app description
- [ ] Write privacy policy
- [ ] Write terms of service

---

## 🚀 DAY 3-4 TASKS

### Day 3
- [ ] Final testing on multiple devices
- [ ] Build production APK/IPA
- [ ] Test production builds
- [ ] Prepare app store listings

### Day 4
- [ ] Submit to Google Play
- [ ] Submit to App Store
- [ ] Monitor submissions
- [ ] Prepare launch materials

---

## 📋 QUICK COMMANDS

### Backend
```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

# Run migrations
alembic upgrade head

# Check health
curl http://localhost:8000/health/detailed

# View logs
tail -f backend.log
```

### Mobile
```bash
# Start mobile
cd mobile
npx expo start --clear --port 8082 --lan

# Get your IP
ipconfig getifaddr en0

# Build for testing
npx expo prebuild --clean
```

### Docker
```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

---

## 🐛 COMMON ISSUES

### "Sentry not configured"
**Fix:** Add SENTRY_DSN to backend/.env

### "FCM not configured"
**Fix:** Add FCM_SERVER_KEY to backend/.env

### "Push notifications not working"
**Fix:** 
1. Use physical device (not simulator)
2. Check Firebase setup complete
3. Check token registered in MongoDB
4. Check FCM server key correct

### "Database migration failed"
**Fix:**
```bash
alembic downgrade -1
alembic upgrade head
```

### "App won't connect to backend"
**Fix:**
1. Check backend is running
2. Check EXPO_PUBLIC_API_URL in mobile/.env
3. Use LAN IP, not localhost
4. Check same WiFi network

---

## 📊 SUCCESS CRITERIA

### Today
- [x] Database indexes added ✅
- [x] Sentry integrated ✅
- [x] Push notifications implemented ✅
- [ ] Sentry account setup
- [ ] Firebase setup complete
- [ ] 50% of tests passing

### Tomorrow
- [ ] 100% of critical tests passing
- [ ] All bugs documented
- [ ] Critical bugs fixed
- [ ] App store assets created

### Day 3-4
- [ ] Production builds tested
- [ ] App store submissions complete
- [ ] Launch materials ready

---

## 🎯 FOCUS AREAS

### Don't Get Distracted By
- ❌ Advanced animations
- ❌ Search functionality
- ❌ Focus mode
- ❌ Events/Habits systems
- ❌ Image uploads
- ❌ Automated tests

### Stay Focused On
- ✅ Manual testing
- ✅ Bug fixes
- ✅ Firebase setup
- ✅ Sentry setup
- ✅ App store assets
- ✅ Legal documents

---

## 💪 MOTIVATION

### What You've Built
- 99% complete backend
- 92% complete mobile app
- Full social features
- Push notifications
- Error tracking
- Performance optimizations

### What's Left
- 4-6 hours of testing
- 1 hour of Firebase setup
- 1 day of app store prep
- **Total: 2-3 days of work**

### You're Almost There!
**95% complete** → **100% complete** → **LAUNCH!**

---

## 📞 HELP

### Documentation
- `COMPREHENSIVE_TEST_CHECKLIST.md` - All test cases
- `PUSH_NOTIFICATIONS_SETUP.md` - Firebase setup
- `FINAL_IMPLEMENTATION_COMPLETE.md` - What's done
- `MASTER_TODO.md` - Full task list

### Stuck?
1. Check documentation above
2. Check backend logs: `tail -f backend/backend.log`
3. Check mobile console in Expo
4. Check Docker logs: `docker compose logs -f`

---

**START HERE:** Run database migration, setup Sentry, start testing

**GOAL:** Launch in 4-5 days

**YOU GOT THIS!** 🚀
