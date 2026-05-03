# Mobile App Connection Fix

## Problem
Mobile app shows "Cannot reach server, check your WiFi and API URL"

## Root Cause
Backend is running on `localhost` only, not accessible from network (phone can't reach it)

---

## ✅ SOLUTION

### Step 1: Stop Current Backend
If backend is running, stop it with `Ctrl+C`

### Step 2: Start Backend with Network Access

```bash
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

**Important:** Use `--host 0.0.0.0` to make it accessible from your phone!

### Step 3: Verify Backend is Accessible

Open a new terminal and test:

```bash
# Test from localhost (should work)
curl http://localhost:8000/health

# Test from network IP (should also work now)
curl http://192.168.1.5:8000/health
```

Both should return: `{"status":"ok","version":"2.0.0"}`

### Step 4: Restart Mobile App

```bash
cd mobile
npx expo start --clear
```

### Step 5: Test Login on Phone

1. Open Expo Go app on your phone
2. Scan QR code or enter URL
3. Try logging in with a test user
4. Should work now!

---

## 🔍 VERIFICATION CHECKLIST

- [ ] Backend started with `--host 0.0.0.0`
- [ ] `curl http://192.168.1.5:8000/health` returns success
- [ ] Phone and Mac on same WiFi network
- [ ] Mobile app restarted with `--clear`
- [ ] API URL in mobile/.env is `http://192.168.1.5:8000/api/v1`

---

## 🎯 QUICK COMMANDS

### Start Backend (Correct Way)
```bash
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Start Mobile App
```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

---

## 🐛 STILL NOT WORKING?

### Check 1: Verify IP Address
```bash
ipconfig getifaddr en0
```

Should show: `192.168.1.5`

If different, update `mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:8000/api/v1
```

### Check 2: Verify WiFi
- Mac and phone must be on **same WiFi network**
- Not on guest network
- Not using VPN

### Check 3: Test API Directly
From your phone's browser, visit:
```
http://192.168.1.5:8000/health
```

Should see: `{"status":"ok","version":"2.0.0"}`

### Check 4: Check Firewall
```bash
# macOS - Allow incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/python3
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/python3
```

### Check 5: Test with Test User

Create a test user if you don't have one:
```bash
cd backend
python3 seed_users.py
```

Test users:
- Email: `alice@test.com`
- Password: `password123`

---

## 📱 MOBILE APP LOGS

If still having issues, check mobile app logs:

1. In Expo Go, shake phone
2. Select "Show Dev Menu"
3. Select "Debug Remote JS"
4. Open browser console to see errors

---

## 🔧 COMMON ERRORS

### Error: "Network request failed"
**Fix:** Backend not accessible from network
```bash
# Restart backend with --host 0.0.0.0
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Error: "Connection refused"
**Fix:** Backend not running or wrong port
```bash
# Check if backend is running
lsof -ti:8000

# If nothing, start backend
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Error: "Timeout"
**Fix:** Firewall blocking or wrong IP
```bash
# Check IP
ipconfig getifaddr en0

# Update mobile/.env with correct IP
```

---

## ✅ CORRECT SETUP

### Terminal 1: Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Terminal 2: Mobile App
```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.5 npx expo start --clear --port 8082 --lan
```

### Terminal 3 (Optional): Admin Panel
```bash
cd admin-panel
npm run dev
```

---

## 🎊 SUCCESS INDICATORS

When working correctly:

1. **Backend logs show:**
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   INFO:     Application startup complete.
   ```

2. **Curl test works:**
   ```bash
   curl http://192.168.1.5:8000/health
   # Returns: {"status":"ok","version":"2.0.0"}
   ```

3. **Mobile app connects:**
   - No "Cannot reach server" error
   - Login screen loads
   - Can attempt login

4. **Login works:**
   - Enter credentials
   - Shows loading
   - Redirects to home screen

---

## 📞 NEED MORE HELP?

If still not working, provide:
1. Backend startup logs
2. Mobile app error message
3. Output of `ipconfig getifaddr en0`
4. Output of `curl http://192.168.1.5:8000/health`
5. Are Mac and phone on same WiFi?
