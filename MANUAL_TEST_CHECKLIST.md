# MANUAL TEST CHECKLIST

## Test Environment Setup
- [ ] Backend running on http://192.168.1.5:8000
- [ ] Mobile app running via Expo Go
- [ ] Phone and Mac on same WiFi
- [ ] Docker containers running (MySQL + Redis)

---

## P0: CRITICAL USER FLOWS

### Test 1: Registration Flow
**Steps:**
1. [ ] Open app
2. [ ] Tap "Register"
3. [ ] Enter name: "Test User"
4. [ ] Enter email: "test@example.com"
5. [ ] Enter password: "password123"
6. [ ] Tap "Register"

**Expected:**
- [ ] Loading indicator appears
- [ ] Success: Navigate to Home screen
- [ ] User name appears in greeting
- [ ] Initial stats show: 0 streak, 0 XP, Level 1

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 2: Login Flow
**Steps:**
1. [ ] Logout from app
2. [ ] Tap "Login"
3. [ ] Enter email: "test@example.com"
4. [ ] Enter password: "password123"
5. [ ] Tap "Login"

**Expected:**
- [ ] Loading indicator appears
- [ ] Success: Navigate to Home screen
- [ ] User data persists
- [ ] Stats show correct values

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 3: Create Task Flow
**Steps:**
1. [ ] Navigate to Home screen
2. [ ] Tap "+" FAB or "Create Task" button
3. [ ] Enter title: "Morning workout"
4. [ ] Select difficulty: 3 (Steady)
5. [ ] Select schedule: Daily
6. [ ] Tap "Commit mission"

**Expected:**
- [ ] Loading indicator on button
- [ ] Success: Navigate back to Home
- [ ] New task appears in task list
- [ ] Task shows correct difficulty and XP

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 4: Complete Task Flow
**Steps:**
1. [ ] Navigate to Home screen
2. [ ] Find created task in list
3. [ ] Tap "Done" button on task card

**Expected:**
- [ ] Button shows loading state
- [ ] Task disappears from list
- [ ] Streak increases by 1
- [ ] XP increases by 30 (difficulty 3 × 10)
- [ ] Level stays same or increases
- [ ] XP gain toast appears (if implemented)

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 5: Dashboard Data Flow
**Steps:**
1. [ ] Navigate to Home screen
2. [ ] Pull down to refresh
3. [ ] Check stats cards
4. [ ] Navigate to Stats screen
5. [ ] Check all data displays

**Expected:**
- [ ] Refresh indicator appears
- [ ] Data updates correctly
- [ ] Streak shows correct value
- [ ] XP shows correct value
- [ ] Level shows correct value
- [ ] Stats screen shows detailed analytics
- [ ] Heatmap displays (if data available)
- [ ] Milestones show correct status

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

## P1: SECONDARY FLOWS

### Test 6: Theme Switching
**Steps:**
1. [ ] Navigate to Profile screen
2. [ ] Find theme switcher
3. [ ] Switch to Light mode
4. [ ] Switch to Dark mode
5. [ ] Switch to System mode

**Expected:**
- [ ] Theme changes immediately
- [ ] All screens update correctly
- [ ] Colors are consistent
- [ ] Text is readable
- [ ] Selection persists after app restart

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 7: Profile Screen
**Steps:**
1. [ ] Navigate to Profile screen
2. [ ] Check user info display
3. [ ] Check stats grid
4. [ ] Scroll through all sections

**Expected:**
- [ ] User name displays correctly
- [ ] Email displays correctly
- [ ] Stats show correct values
- [ ] All sections render without errors
- [ ] Animations work smoothly

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 8: Create Task with AI Suggestions
**Steps:**
1. [ ] Navigate to Create Task screen
2. [ ] Start typing: "30 min meditation"
3. [ ] Wait for AI suggestions

**Expected:**
- [ ] AI suggestions appear
- [ ] Difficulty auto-adjusts
- [ ] Sensor detection works (timer)
- [ ] Target detection works (30 min)

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 9: Multiple Task Completion
**Steps:**
1. [ ] Create 3 tasks with different difficulties
2. [ ] Complete all 3 tasks
3. [ ] Check XP calculation

**Expected:**
- [ ] All tasks complete successfully
- [ ] XP increases correctly for each
- [ ] Streak increases by 1 (not 3)
- [ ] Dashboard updates after each completion

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

## P2: SOCIAL FEATURES

### Test 10: Connections Tab
**Steps:**
1. [ ] Navigate to Social screen
2. [ ] Tap Connections tab
3. [ ] Check for pending requests
4. [ ] Check for accepted connections

**Expected:**
- [ ] Tab loads without errors
- [ ] Empty state shows if no connections
- [ ] Pull-to-refresh works
- [ ] UI is responsive

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 11: Groups Tab
**Steps:**
1. [ ] Navigate to Social screen
2. [ ] Tap Groups tab
3. [ ] Check "My Groups" section
4. [ ] Check "Discover Groups" section

**Expected:**
- [ ] Tab loads without errors
- [ ] Empty state shows if no groups
- [ ] Create Group button visible
- [ ] Pull-to-refresh works

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 12: Leaderboard Tab
**Steps:**
1. [ ] Navigate to Social screen
2. [ ] Tap Leaderboard tab
3. [ ] Check ranking display

**Expected:**
- [ ] Tab loads without errors
- [ ] Empty state shows if no connections
- [ ] Top 3 have medal colors
- [ ] Stats display correctly
- [ ] Pull-to-refresh works

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 13: Feed Tab
**Steps:**
1. [ ] Navigate to Social screen
2. [ ] Tap Feed tab
3. [ ] Check activity feed

**Expected:**
- [ ] Tab loads without errors
- [ ] Empty state shows if no activity
- [ ] Activities show correct icons
- [ ] Timestamps are relative
- [ ] Pull-to-refresh works

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

## P3: ERROR HANDLING

### Test 14: Network Error Handling
**Steps:**
1. [ ] Turn off WiFi
2. [ ] Try to create a task
3. [ ] Turn on WiFi
4. [ ] Check if task syncs

**Expected:**
- [ ] Offline indicator appears (if implemented)
- [ ] Task queued for sync
- [ ] No crash or error
- [ ] Task syncs when online

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 15: Invalid Input Handling
**Steps:**
1. [ ] Try to create task with empty title
2. [ ] Try to login with wrong password
3. [ ] Try to register with invalid email

**Expected:**
- [ ] Validation errors show
- [ ] Error messages are clear
- [ ] No crash
- [ ] User can correct and retry

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 16: Loading States
**Steps:**
1. [ ] Check loading states on all screens
2. [ ] Check loading states on all buttons
3. [ ] Check loading states during API calls

**Expected:**
- [ ] Loading indicators appear
- [ ] UI is disabled during loading
- [ ] No double-submission possible
- [ ] Loading states clear after completion

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 17: Empty States
**Steps:**
1. [ ] Check Home screen with no tasks
2. [ ] Check Stats screen with no data
3. [ ] Check Social tabs with no connections

**Expected:**
- [ ] Empty states show helpful messages
- [ ] CTAs are clear
- [ ] Icons are appropriate
- [ ] No broken UI

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

## P4: PERFORMANCE

### Test 18: App Launch Time
**Steps:**
1. [ ] Force quit app
2. [ ] Launch app
3. [ ] Time until Home screen appears

**Expected:**
- [ ] Launch time < 3 seconds
- [ ] No white screen flash
- [ ] Smooth transition

**Actual Result:**
- Time: _____ seconds
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 19: Screen Transitions
**Steps:**
1. [ ] Navigate between all tabs
2. [ ] Navigate to Create Task and back
3. [ ] Navigate to Profile and back

**Expected:**
- [ ] Transitions < 500ms
- [ ] No lag or stutter
- [ ] Smooth animations

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

### Test 20: List Scrolling
**Steps:**
1. [ ] Create 10+ tasks
2. [ ] Scroll through task list
3. [ ] Check Stats screen scrolling

**Expected:**
- [ ] Smooth 60 FPS scrolling
- [ ] No lag
- [ ] No memory issues

**Actual Result:**
- Status: ⬜ PASS / ⬜ FAIL
- Notes: _______________

---

## SUMMARY

### Test Results
- Total Tests: 20
- Passed: ___
- Failed: ___
- Skipped: ___

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Non-Critical Issues Found
1. _______________
2. _______________
3. _______________

### Recommendations
1. _______________
2. _______________
3. _______________

---

**Tested By:** _______________
**Date:** _______________
**App Version:** 2.0.0
**Device:** _______________
**OS Version:** _______________
