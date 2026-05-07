# MANUAL TESTING CHECKLIST

> Complete testing guide for Consistency App
> Status: Ready for Execution
> Estimated Time: 4-6 hours

---

## Pre-Testing Setup

### Backend
- [ ] Docker services running (`docker compose ps`)
- [ ] Backend running (`uvicorn app.main:app --reload --port 8000 --host 0.0.0.0`)
- [ ] Health check passes (`curl http://localhost:8000/health`)
- [ ] Database migrations applied (`alembic upgrade head`)

### Mobile
- [ ] Dependencies installed (`npm install`)
- [ ] .env configured with correct API_URL
- [ ] App running on physical device (push notifications need real device)
- [ ] Network connectivity verified

---

## Test Suite 1: Authentication Flow (15 min)

### 1.1 Registration
- [ ] Open app → See onboarding screen
- [ ] Tap "Get Started" → Navigate to register screen
- [ ] Enter username: `testuser1`
- [ ] Enter email: `test1@example.com`
- [ ] Enter password: `Test123!`
- [ ] Tap "Register"
- [ ] **Expected:** Success, navigate to home screen
- [ ] **Verify:** User appears in database

### 1.2 Login
- [ ] Logout from app
- [ ] Tap "Login"
- [ ] Enter email: `test1@example.com`
- [ ] Enter password: `Test123!`
- [ ] Tap "Login"
- [ ] **Expected:** Success, navigate to home screen
- [ ] **Verify:** Token stored in AsyncStorage

### 1.3 Invalid Credentials
- [ ] Logout from app
- [ ] Try login with wrong password
- [ ] **Expected:** Error message displayed
- [ ] Try login with non-existent email
- [ ] **Expected:** Error message displayed

---

## Test Suite 2: Task Management (30 min)

### 2.1 Create Task
- [ ] Navigate to "Create" tab
- [ ] Enter title: "Morning Workout"
- [ ] Select category: "Health"
- [ ] Set difficulty: 3
- [ ] Set estimated time: 30 minutes
- [ ] Tap "Create Task"
- [ ] **Expected:** Success toast, navigate to home
- [ ] **Verify:** Task appears in home screen list

### 2.2 Create Multiple Tasks
- [ ] Create task: "Read 20 pages" (difficulty 2)
- [ ] Create task: "Meditate 10 min" (difficulty 1)
- [ ] Create task: "Code review" (difficulty 4)
- [ ] Create task: "Learn Spanish" (difficulty 3)
- [ ] **Expected:** All tasks appear in home screen

### 2.3 Complete Task
- [ ] Tap checkbox on "Morning Workout"
- [ ] **Expected:** 
  - Success toast with XP gained
  - Task marked complete
  - XP counter updates
  - Streak updates
- [ ] **Verify:** Completion in database

### 2.4 Complete Multiple Tasks
- [ ] Complete "Read 20 pages"
- [ ] Complete "Meditate 10 min"
- [ ] **Expected:** XP accumulates correctly
- [ ] **Verify:** Stats update in Progress tab

### 2.5 Task with AI Suggestions
- [ ] Create new task
- [ ] Start typing "workout"
- [ ] **Expected:** AI suggestions appear
- [ ] Select a suggestion
- [ ] **Expected:** Form auto-fills

---

## Test Suite 3: Streaks & XP (20 min)

### 3.1 First Day Streak
- [ ] Complete first task of the day
- [ ] **Expected:** Streak = 1
- [ ] **Verify:** Streak displayed in home screen

### 3.2 XP Calculation
- [ ] Note current XP
- [ ] Complete difficulty 3 task
- [ ] **Expected:** XP increases (base 30 + bonuses)
- [ ] **Verify:** XP formula correct

### 3.3 Level Up
- [ ] Complete enough tasks to level up
- [ ] **Expected:** 
  - Level up notification (if push enabled)
  - Level badge updates
  - Celebration animation (if implemented)

### 3.4 Streak Milestone
- [ ] Simulate 7-day streak (or use seed data)
- [ ] **Expected:** 
  - Streak milestone notification
  - Streak shield awarded
  - Milestone badge displayed

---

## Test Suite 4: Offline Sync (30 min)

### 4.1 Offline Task Creation
- [ ] Turn on Airplane Mode
- [ ] Create task: "Offline Task 1"
- [ ] **Expected:** Task saved locally
- [ ] **Verify:** Task in SQLite database

### 4.2 Offline Task Completion
- [ ] Complete "Offline Task 1" (still offline)
- [ ] **Expected:** Completion saved locally
- [ ] **Verify:** Pending sync queue has entry

### 4.3 Online Sync
- [ ] Turn off Airplane Mode
- [ ] Wait for auto-sync (or pull-to-refresh)
- [ ] **Expected:** 
  - Sync indicator shows
  - Tasks sync to backend
  - Local queue clears
- [ ] **Verify:** Tasks in backend database

### 4.4 Conflict Resolution
- [ ] Create task online
- [ ] Go offline
- [ ] Complete same task offline
- [ ] Go online
- [ ] **Expected:** No duplicates, completion syncs

---

## Test Suite 5: Social Features (45 min)

### 5.1 Connections
- [ ] Navigate to Social → Connections tab
- [ ] Tap "Add Connection"
- [ ] Search for user: `testuser2`
- [ ] Send connection request
- [ ] **Expected:** Request sent, status "pending"

### 5.2 Accept Connection (use second device/account)
- [ ] Login as `testuser2`
- [ ] Navigate to Social → Connections
- [ ] See pending request from `testuser1`
- [ ] Tap "Accept"
- [ ] **Expected:** Connection accepted, both users connected

### 5.3 Leaderboard
- [ ] Navigate to Social → Leaderboard tab
- [ ] **Expected:** See connected users ranked by XP
- [ ] **Verify:** Rankings correct based on XP

### 5.4 Activity Feed
- [ ] Navigate to Social → Feed tab
- [ ] **Expected:** See recent activities from connections
- [ ] Complete a task
- [ ] **Expected:** Activity appears in feed

### 5.5 Create Group
- [ ] Navigate to Social → Groups tab
- [ ] Tap "Create Group"
- [ ] Enter name: "Fitness Squad"
- [ ] Select emoji: 💪
- [ ] Set privacy: Public
- [ ] Tap "Create"
- [ ] **Expected:** Group created, navigate to group detail

### 5.6 Group Chat
- [ ] In group detail, go to Chat tab
- [ ] Type message: "Hello team!"
- [ ] Send message
- [ ] **Expected:** Message appears in chat
- [ ] Long press message
- [ ] **Expected:** Reaction picker appears
- [ ] Add reaction
- [ ] **Expected:** Reaction appears on message

### 5.7 Group Challenge
- [ ] In group detail, go to Challenges tab
- [ ] Tap "Create Challenge" (if admin)
- [ ] Enter title: "100 Push-ups"
- [ ] Set target: 100 reps
- [ ] Create challenge
- [ ] **Expected:** Challenge appears in list
- [ ] Tap "Log Progress"
- [ ] Enter progress: 20
- [ ] **Expected:** Progress bar updates

---

## Test Suite 6: Stats & Analytics (20 min)

### 6.1 Dashboard Stats
- [ ] Navigate to Home screen
- [ ] **Expected:** See stats cards:
  - Current streak
  - Total XP
  - Level
  - Consistency index

### 6.2 Progress Screen
- [ ] Navigate to Progress tab
- [ ] **Expected:** See:
  - Heatmap of completions
  - Weekly overview
  - Milestones
  - AI insights

### 6.3 Insights
- [ ] Check AI insights section
- [ ] **Expected:** Personalized insights based on behavior
- [ ] **Verify:** Insights make sense for user's data

---

## Test Suite 7: Theme System (10 min)

### 7.1 Dark Mode
- [ ] Navigate to Profile → Settings
- [ ] Tap "Theme"
- [ ] Select "Dark"
- [ ] **Expected:** App switches to dark theme
- [ ] **Verify:** All screens use dark colors

### 7.2 Light Mode
- [ ] Select "Light" theme
- [ ] **Expected:** App switches to light theme
- [ ] **Verify:** All screens use light colors

### 7.3 System Mode
- [ ] Select "System" theme
- [ ] Change device theme
- [ ] **Expected:** App follows device theme

---

## Test Suite 8: Error Handling (20 min)

### 8.1 Network Error
- [ ] Turn on Airplane Mode
- [ ] Try to refresh dashboard
- [ ] **Expected:** Error state with retry button
- [ ] Tap retry
- [ ] **Expected:** Shows "No connection" message

### 8.2 Invalid Data
- [ ] Try to create task with empty title
- [ ] **Expected:** Validation error
- [ ] Try to create task with difficulty 0
- [ ] **Expected:** Validation error

### 8.3 Server Error
- [ ] Stop backend server
- [ ] Try to complete task
- [ ] **Expected:** Error toast, task saved locally
- [ ] Start backend
- [ ] **Expected:** Auto-sync when connection restored

---

## Test Suite 9: Push Notifications (30 min)

### 9.1 Registration
- [ ] Login to app
- [ ] Check console for: "✅ Push token registered"
- [ ] **Verify:** Token in MongoDB users collection

### 9.2 Test Notification
- [ ] Use test endpoint:
  ```bash
  curl -X POST http://localhost:8000/api/v1/notifications/test \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title": "Test", "body": "Test notification"}'
  ```
- [ ] **Expected:** Notification received on device

### 9.3 Level Up Notification
- [ ] Complete tasks until level up
- [ ] **Expected:** Level up notification received

### 9.4 Streak Milestone Notification
- [ ] Reach 7-day streak (or use seed data)
- [ ] **Expected:** Streak milestone notification

### 9.5 Notification Tap
- [ ] Tap on notification
- [ ] **Expected:** App opens to relevant screen

---

## Test Suite 10: Performance (15 min)

### 10.1 Load Time
- [ ] Close app completely
- [ ] Open app
- [ ] **Expected:** App loads in < 3 seconds

### 10.2 List Scrolling
- [ ] Create 50+ tasks (or use seed data)
- [ ] Scroll through task list
- [ ] **Expected:** Smooth scrolling, no lag

### 10.3 Pull-to-Refresh
- [ ] Pull down on home screen
- [ ] **Expected:** Refresh indicator, data updates

### 10.4 Cache Performance
- [ ] Load dashboard
- [ ] Note load time
- [ ] Navigate away and back
- [ ] **Expected:** Instant load from cache

---

## Test Suite 11: Edge Cases (20 min)

### 11.1 Empty States
- [ ] New user with no tasks
- [ ] **Expected:** Empty state with helpful message
- [ ] No connections
- [ ] **Expected:** Empty state with "Add connections" CTA

### 11.2 Long Text
- [ ] Create task with very long title (200+ chars)
- [ ] **Expected:** Text truncates properly
- [ ] Send long message in group chat
- [ ] **Expected:** Message wraps correctly

### 11.3 Special Characters
- [ ] Create task with emojis: "🏋️ Workout 💪"
- [ ] **Expected:** Displays correctly
- [ ] Send message with special chars: "Test @#$%"
- [ ] **Expected:** Displays correctly

### 11.4 Rapid Actions
- [ ] Rapidly tap complete on multiple tasks
- [ ] **Expected:** All completions register, no duplicates
- [ ] Rapidly create multiple tasks
- [ ] **Expected:** All tasks created

---

## Test Suite 12: Security (15 min)

### 12.1 Token Expiration
- [ ] Login
- [ ] Wait for token to expire (or manually expire)
- [ ] Try to complete task
- [ ] **Expected:** Redirect to login

### 12.2 Unauthorized Access
- [ ] Logout
- [ ] Try to access protected screen
- [ ] **Expected:** Redirect to login

### 12.3 Data Isolation
- [ ] Login as user1
- [ ] Note tasks
- [ ] Logout, login as user2
- [ ] **Expected:** Only see user2's tasks

---

## Bug Tracking Template

For each bug found:

```
Bug ID: BUG-001
Severity: High/Medium/Low
Screen: Home Screen
Steps to Reproduce:
1. Step 1
2. Step 2
3. Step 3

Expected: What should happen
Actual: What actually happened
Screenshot: [attach if applicable]
Device: iPhone 14 Pro / Pixel 7
OS: iOS 17.2 / Android 14
App Version: 1.0.0
```

---

## Test Results Summary

### Pass/Fail Counts
- Total Tests: 100+
- Passed: ___
- Failed: ___
- Blocked: ___
- Skipped: ___

### Critical Issues
1. 
2. 
3. 

### Medium Issues
1. 
2. 
3. 

### Low Issues
1. 
2. 
3. 

---

## Sign-Off

- [ ] All critical tests passed
- [ ] All medium issues documented
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

**Tester:** _______________
**Date:** _______________
**Signature:** _______________

---

**Status:** Ready for Execution
**Estimated Time:** 4-6 hours
**Last Updated:** January 2025
