# Push Notifications Setup Guide

## Overview
This guide covers setting up push notifications for the Consistency App using Firebase Cloud Messaging (FCM) and Expo Notifications.

---

## Prerequisites

1. **Firebase Project** - Create at https://console.firebase.google.com
2. **Expo Account** - Sign up at https://expo.dev
3. **Physical Device** - Push notifications don't work in simulators/emulators

---

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Enter project name: "Consistency App"
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Add Android App
1. In Firebase Console, click "Add app" → Android
2. Enter package name: `com.anonymous.mobile` (from app.json)
3. Download `google-services.json`
4. Place in `mobile/` directory
5. Click "Next" → "Continue to console"

### 1.3 Add iOS App
1. In Firebase Console, click "Add app" → iOS
2. Enter bundle ID: `com.anonymous.mobile` (from app.json)
3. Download `GoogleService-Info.plist`
4. Place in `mobile/` directory
5. Click "Next" → "Continue to console"

### 1.4 Get FCM Server Key
1. In Firebase Console, go to Project Settings (gear icon)
2. Go to "Cloud Messaging" tab
3. Under "Cloud Messaging API (Legacy)", enable it
4. Copy "Server key"
5. Add to `backend/.env`:
   ```
   FCM_SERVER_KEY=your_server_key_here
   ```

---

## Step 2: Expo Setup

### 2.1 Install EAS CLI
```bash
npm install -g eas-cli
```

### 2.2 Login to Expo
```bash
eas login
```

### 2.3 Configure EAS Project
```bash
cd mobile
eas init
```

### 2.4 Update app.json
Add your Expo project ID to `mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

---

## Step 3: Backend Configuration

### 3.1 Install Dependencies
```bash
cd backend
pip install sentry-sdk[fastapi]==2.0.0
```

### 3.2 Update .env
```bash
# Push Notifications
FCM_SERVER_KEY=your_fcm_server_key_here

# Error Tracking (Optional)
SENTRY_DSN=your_sentry_dsn_here
ENVIRONMENT=development
```

### 3.3 Restart Backend
```bash
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

---

## Step 4: Mobile Configuration

### 4.1 Add Firebase Config Files
Place these files in `mobile/` directory:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

### 4.2 Update app.json
Already configured with expo-notifications plugin.

### 4.3 Rebuild App
```bash
cd mobile
npx expo prebuild --clean
```

---

## Step 5: Testing

### 5.1 Test on Physical Device
1. Start backend: `uvicorn app.main:app --reload --port 8000 --host 0.0.0.0`
2. Start mobile: `npx expo start --clear`
3. Open app on physical device
4. Login to app
5. Check console for: "✅ Push token registered with backend"

### 5.2 Send Test Notification
Use the test endpoint:
```bash
curl -X POST http://localhost:8000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test notification"
  }'
```

### 5.3 Test Milestone Notifications
1. Complete a task to trigger XP gain
2. Level up to trigger level-up notification
3. Reach 7-day streak to trigger streak milestone

---

## Notification Types

### Automatic Notifications
- **Level Up** - Sent when user levels up
- **Streak Milestone** - Sent at 7, 14, 30, 60, 100 day streaks
- **Connection Request** - Sent when someone sends connection request
- **Group Message** - Sent when someone messages in a group
- **Challenge Invite** - Sent when invited to a challenge

### Scheduled Notifications (Future)
- **Task Reminder** - Daily reminder for pending tasks
- **Daily Summary** - End-of-day summary of accomplishments

---

## Troubleshooting

### Issue: "Push notifications only work on physical devices"
**Solution:** Use a physical device, not simulator/emulator

### Issue: "Project ID not found in app config"
**Solution:** Add `extra.eas.projectId` to app.json (see Step 2.4)

### Issue: "FCM_SERVER_KEY not configured"
**Solution:** Add FCM_SERVER_KEY to backend/.env (see Step 1.4)

### Issue: "Failed to register token with backend"
**Solution:** 
1. Check backend is running
2. Check EXPO_PUBLIC_API_URL in mobile/.env
3. Check user is logged in
4. Check network connectivity

### Issue: Notifications not received
**Solution:**
1. Check notification permissions are granted
2. Check FCM server key is correct
3. Check token is registered in MongoDB
4. Check backend logs for errors
5. Try sending test notification

---

## Production Deployment

### Android
1. Build APK/AAB with EAS:
   ```bash
   eas build --platform android
   ```
2. Upload to Google Play Console
3. Enable FCM in Firebase Console

### iOS
1. Get APNs certificate from Apple Developer
2. Upload to Firebase Console (Cloud Messaging → APNs)
3. Build IPA with EAS:
   ```bash
   eas build --platform ios
   ```
4. Upload to App Store Connect

---

## Monitoring

### Check Notification Logs
MongoDB collection: `notifications`
```javascript
db.notifications.find({ user_id: 123 }).sort({ sent_at: -1 }).limit(10)
```

### Check FCM Tokens
MongoDB collection: `users`
```javascript
db.users.findOne({ user_id: 123 }, { fcm_tokens: 1 })
```

### Sentry Error Tracking
1. Sign up at https://sentry.io
2. Create new project
3. Copy DSN
4. Add to backend/.env: `SENTRY_DSN=your_dsn_here`
5. Restart backend

---

## API Endpoints

### Register Token
```
POST /api/v1/notifications/register-token
Body: { "token": "ExponentPushToken[...]" }
```

### Unregister Token
```
POST /api/v1/notifications/unregister-token
Body: { "token": "ExponentPushToken[...]" }
```

### Send Test Notification
```
POST /api/v1/notifications/test
Body: { "title": "Test", "body": "Test message" }
```

---

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Test notifications on physical device
3. ✅ Verify milestone notifications work
4. ⏭️ Add scheduled task reminders
5. ⏭️ Add daily summary notifications
6. ⏭️ Setup Sentry error tracking
7. ⏭️ Deploy to production

---

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Sentry Docs](https://docs.sentry.io/)

---

**Status:** Ready for Testing
**Last Updated:** January 2025
