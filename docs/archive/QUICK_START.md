# ✅ Immediate Action Checklist

> Quick checklist to get the app running after all fixes

---

## 🚀 STEP 1: Install Missing Packages (5 minutes)

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/mobile

# Install missing packages
npm install react-native-svg expo-secure-store

# Verify installation
npm list react-native-svg expo-secure-store
```

**Expected Output**:
```
mobile@1.0.0
├── react-native-svg@X.X.X
└── expo-secure-store@X.X.X
```

---

## 🔧 STEP 2: Update SecureStore (2 minutes)

After installing expo-secure-store, update the file:

**File**: `mobile/src/utils/secureStorage.ts`

Replace the mock implementation at the top with:
```typescript
import * as SecureStore from 'expo-secure-store';
```

Remove the mock SecureStore object (lines 10-35).

---

## 🗄️ STEP 3: Run Database Migration (2 minutes)

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend

# Activate virtual environment
source venv/bin/activate

# Run migration
alembic upgrade head
```

**Expected Output**:
```
INFO  [alembic.runtime.migration] Running upgrade -> security_enhancements_001
```

---

## 🔥 STEP 4: Start Backend (1 minute)

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend

# Make sure Docker is running
docker compose up -d

# Start server
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Verify**:
- Open http://localhost:8000/health
- Should see: `{"status": "ok", "version": "2.0.0"}`

---

## 📱 STEP 5: Start Mobile App (2 minutes)

```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/mobile

# Get your Mac's IP
ipconfig getifaddr en0

# Start app (replace with your IP)
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.19 npx expo start --clear --port 8082 --lan
```

**On Phone**:
1. Open Expo Go app
2. Enter URL: `exp://192.168.1.19:8082`
3. App should load without errors

---

## ✅ STEP 6: Verify Everything Works (5 minutes)

### Backend Tests
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
```

### Mobile Tests
1. **Login** - Use alice@test.com / password123
2. **Close App** - Completely close the app
3. **Reopen App** - Should stay logged in (token persistence)
4. **Scroll Tasks** - Should be smooth at 60 FPS
5. **Trigger Error** - Navigate to a screen, should show error boundary if error occurs
6. **Logout** - Should clear all data

---

## 🐛 TROUBLESHOOTING

### Issue: npm install fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Alembic migration fails
```bash
# Check current revision
alembic current

# If needed, downgrade and retry
alembic downgrade -1
alembic upgrade head
```

### Issue: Backend won't start
```bash
# Check if port is in use
lsof -ti:8000 | xargs kill -9

# Check Docker
docker ps

# Restart Docker if needed
docker compose down
docker compose up -d
```

### Issue: Mobile app won't load
```bash
# Clear Metro cache
npx expo start --clear

# Check if IP is correct
ipconfig getifaddr en0

# Make sure phone and Mac are on same WiFi
```

### Issue: TypeScript errors after installing packages
```bash
# Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) -> "TypeScript: Restart TS Server"

# Or run check manually
npx tsc --noEmit
```

---

## 📊 VERIFICATION CHECKLIST

- [ ] react-native-svg installed
- [ ] expo-secure-store installed
- [ ] SecureStore mock removed
- [ ] Database migration run successfully
- [ ] Backend starts without errors
- [ ] Health endpoint returns OK
- [ ] Mobile app loads without errors
- [ ] Login works
- [ ] Token persists after app restart
- [ ] FlatList scrolls smoothly
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🎯 EXPECTED RESULTS

### Backend
```
✅ Server running on http://0.0.0.0:8000
✅ MySQL connected
✅ Redis connected
✅ 0 errors in console
```

### Mobile
```
✅ App loads successfully
✅ Login works
✅ Token persists
✅ Smooth scrolling
✅ 0 TypeScript errors
✅ 0 runtime errors
```

---

## 📞 NEED HELP?

1. Check `ERROR_FIXES.md` for error solutions
2. Check `MIGRATION_GUIDE.md` for detailed steps
3. Check `QUICK_REFERENCE.md` for code patterns
4. Check console logs for specific errors

---

## ⏱️ TOTAL TIME: ~15 minutes

- Step 1: 5 minutes
- Step 2: 2 minutes
- Step 3: 2 minutes
- Step 4: 1 minute
- Step 5: 2 minutes
- Step 6: 5 minutes

---

## 🎉 DONE!

Once all steps are complete:
- ✅ All packages installed
- ✅ All errors fixed
- ✅ Backend running
- ✅ Mobile running
- ✅ Everything tested

**You're ready to start developing! 🚀**

---

## 📝 NOTES

- Keep this checklist handy for future setups
- Run these steps after pulling new code
- Share with team members for onboarding
- Update as needed for your environment

---

**Last Updated**: January 2025
**Status**: ✅ READY TO USE
