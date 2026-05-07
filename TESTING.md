# 🧪 Testing Guide

Complete testing documentation for the Consistency App.

---

## Quick Start

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Mobile Tests
```bash
cd mobile
npm test
```

---

## Backend Testing

### Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install pytest pytest-asyncio httpx
```

### Run Tests
```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_auth.py -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Structure
```
backend/tests/
├── conftest.py           # Fixtures
├── test_auth.py          # Auth endpoints
├── test_tasks.py         # Task CRUD
├── test_stats.py         # Stats/dashboard
└── test_health.py        # Health checks
```

### Key Test Cases

#### Authentication
- ✅ User registration
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ JWT token generation
- ✅ Protected endpoint access

#### Tasks
- ✅ Create task
- ✅ List tasks
- ✅ Update task
- ✅ Delete task
- ✅ Complete task
- ✅ Streak calculation
- ✅ XP calculation

#### Stats
- ✅ Dashboard aggregation
- ✅ Streak tracking
- ✅ Level calculation
- ✅ CI calculation

---

## Mobile Testing

### Setup
```bash
cd mobile
npm install
```

### Run Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Structure
```
mobile/__tests__/
├── components/
│   ├── Card.test.tsx
│   ├── Header.test.tsx
│   └── EmptyState.test.tsx
├── screens/
│   ├── HomeScreen.test.tsx
│   └── ProfileScreen.test.tsx
└── utils/
    └── theme.test.ts
```

### Key Test Cases

#### Components
- ✅ Card rendering
- ✅ Header navigation
- ✅ EmptyState display
- ✅ SwipeableTabs gestures

#### Screens
- ✅ HomeScreen data loading
- ✅ ProfileScreen user info
- ✅ CreateTaskScreen form validation

#### Utils
- ✅ Theme switching
- ✅ Date formatting
- ✅ XP calculations

---

## Manual Testing Checklist

### 📱 Device Testing

#### iOS
- [ ] iPhone 14 Pro (notch)
- [ ] iPhone 15 Pro (Dynamic Island)
- [ ] iPhone SE (no notch)
- [ ] iPad (tablet layout)

#### Android
- [ ] Pixel 7 (various sizes)
- [ ] Samsung Galaxy (various sizes)
- [ ] Tablet (10" screen)

### 🎨 UI/UX Testing

#### Safe Areas
- [ ] Status bar doesn't overlap content
- [ ] Bottom tabs don't overlap content
- [ ] Notch/Dynamic Island handled properly
- [ ] Landscape mode works correctly

#### Themes
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] System theme follows device
- [ ] Theme persists after restart

#### Animations
- [ ] Swipe gestures work smoothly
- [ ] Tab transitions are smooth (60fps)
- [ ] Pull-to-refresh works
- [ ] Haptic feedback triggers

#### Typography
- [ ] All text is readable
- [ ] Font sizes are consistent
- [ ] Line heights are proper
- [ ] No text overflow

#### Colors
- [ ] Contrast ratios meet WCAG AA
- [ ] Gradients display correctly
- [ ] Semantic colors used properly
- [ ] Opacity variants work

### 🔧 Functionality Testing

#### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Token persists after restart
- [ ] Logout clears token

#### Tasks
- [ ] Create task with all difficulty levels
- [ ] Edit task
- [ ] Delete task
- [ ] Complete task
- [ ] Streak increments correctly
- [ ] XP awards correctly

#### Offline Mode
- [ ] Tasks created offline sync when online
- [ ] Completions sync correctly
- [ ] Conflict resolution works
- [ ] Sync queue displays pending items

#### Stats
- [ ] Dashboard loads correctly
- [ ] Streak displays accurately
- [ ] Level calculation is correct
- [ ] CI calculation is correct
- [ ] Charts render properly

#### Navigation
- [ ] Bottom tabs switch correctly
- [ ] Back button works
- [ ] Modal presentations work
- [ ] Deep linking works (if implemented)

### ⚡ Performance Testing

#### Load Times
- [ ] App launches in <3 seconds
- [ ] Screens load in <1 second
- [ ] API calls complete in <2 seconds
- [ ] Images load progressively

#### Animations
- [ ] All animations run at 60fps
- [ ] No jank during scrolling
- [ ] Gestures respond immediately
- [ ] Transitions are smooth

#### Memory
- [ ] No memory leaks
- [ ] App doesn't crash on low memory
- [ ] Background tasks don't drain battery
- [ ] Images are properly cached

### 🔒 Security Testing

#### Authentication
- [ ] Passwords are hashed
- [ ] JWT tokens expire correctly
- [ ] Refresh tokens work
- [ ] Protected routes require auth

#### Data
- [ ] User data is isolated
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CORS configured correctly

### ♿ Accessibility Testing

#### Touch Targets
- [ ] All buttons are 44x44 minimum
- [ ] Proper spacing between elements
- [ ] No overlapping touch areas

#### Contrast
- [ ] Text meets WCAG AA (4.5:1)
- [ ] Icons are clearly visible
- [ ] Disabled states are distinguishable

#### Feedback
- [ ] Haptic feedback on interactions
- [ ] Visual feedback on press
- [ ] Loading states display
- [ ] Error messages are clear

---

## Integration Testing

### API Integration
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Database Integration
```bash
# Check MySQL
docker exec -it consistency-mysql mysql -u root -p
USE consistency_db;
SHOW TABLES;

# Check Redis
docker exec -it consistency-redis redis-cli
PING
```

### Mobile-Backend Integration
1. Start backend: `uvicorn app.main:app --reload`
2. Start mobile: `npx expo start --lan`
3. Test full flow: Register → Login → Create Task → Complete Task

---

## Automated Testing

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          pip install -r requirements.txt
          pytest tests/ -v
  
  mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd mobile
          npm install
          npm test
```

---

## Test Data

### Test Users
```
alice@test.com / password123
bob@test.com / password123
charlie@test.com / password123
```

### Test Tasks
```json
{
  "title": "Morning Workout",
  "difficulty": 3,
  "category": "fitness"
}
```

---

## Troubleshooting

### Backend Tests Fail
```bash
# Reset database
docker compose down -v
docker compose up -d
python init_mongodb.py
```

### Mobile Tests Fail
```bash
# Clear cache
cd mobile
rm -rf node_modules
npm install
npm test -- --clearCache
```

### Integration Tests Fail
```bash
# Check services
docker ps
curl http://localhost:8000/health
curl http://localhost:6379  # Redis
```

---

## Coverage Goals

- Backend: >80% coverage
- Mobile: >70% coverage
- Critical paths: 100% coverage

---

## Next Steps

1. Add E2E tests with Detox
2. Add visual regression tests
3. Add performance benchmarks
4. Add load testing
5. Add security scanning

---

**Last Updated**: January 2025
