# Migration Guide - Applying Critical Fixes

> Step-by-step guide to integrate all the new utilities and fixes

---

## 📋 Prerequisites

1. Backup your database
2. Commit all current changes to git
3. Create a new branch: `git checkout -b feature/critical-fixes`
4. Install new dependencies (if needed)

---

## 🔧 Backend Migration

### Step 1: Install Dependencies (if needed)

```bash
cd backend
pip install redis python-multipart
```

### Step 2: Run Database Migration

```bash
cd backend
alembic upgrade head
```

This adds the new User fields:
- `email_verified`
- `verification_token`
- `failed_login_attempts`
- `locked_until`

### Step 3: Update Service Files

#### A. Update `task_service.py`

Find all database queries and wrap them with `run_in_db_thread`:

```python
# Add import at top
from app.utils.async_db import run_in_db_thread

# Example: Update get_tasks function
async def get_tasks(db: Session, user_id: int, page: int = 1, page_size: int = 20):
    offset = (page - 1) * page_size
    
    # Wrap query in thread pool
    tasks = await run_in_db_thread(
        lambda: db.query(Task)
            .filter(Task.user_id == user_id, Task.is_active == True, Task.deleted_at == None)
            .offset(offset)
            .limit(page_size)
            .all()
    )
    
    return tasks
```

Repeat for ALL functions in:
- `task_service.py`
- `auth_service.py`
- `ai_service.py`
- Any other service files

### Step 4: Update Auth Service with Security

```python
# In auth_service.py
from app.core.security_utils import AccountLockout
from app.utils.sanitization import sanitize_email, validate_password

async def login(db: Session, email: str, password: str):
    # Sanitize email
    email = sanitize_email(email)
    
    # Get user
    user = await run_in_db_thread(
        lambda: db.query(User).filter(User.email == email).first()
    )
    
    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    # Check account lockout
    AccountLockout.check_lockout(user)
    
    # Verify password
    if not verify_password(password, user.password_hash):
        await run_in_db_thread(
            lambda: AccountLockout.handle_failed_login(db, user)
        )
        raise HTTPException(401, "Invalid credentials")
    
    # Success - reset lockout counter
    await run_in_db_thread(
        lambda: AccountLockout.handle_successful_login(db, user)
    )
    
    # Generate tokens...
    return tokens

async def register(db: Session, email: str, password: str, name: str):
    # Sanitize inputs
    email = sanitize_email(email)
    validate_password(password)  # Raises ValueError if weak
    
    # Rest of registration logic...
```

### Step 5: Add Rate Limiting to Routes

```python
# In main.py or routes
from app.core.rate_limiter import RateLimiter, get_client_ip
from app.core.config import settings
import redis

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL)
limiter = RateLimiter(redis_client)

# Add to auth routes
@router.post("/auth/login")
async def login(request: Request, credentials: LoginRequest, db: Session = Depends(get_db)):
    # Rate limit by IP
    ip = get_client_ip(request)
    await limiter.check_auth_rate_limit(ip)
    
    # Rest of login logic...

# Add to task routes
@router.post("/tasks/")
async def create_task(
    request: Request,
    data: TaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Rate limit by user
    await limiter.check_user_rate_limit(user.id, max_requests=50, window_seconds=60)
    
    # Rest of create logic...
```

### Step 6: Add Security Headers Middleware

```python
# In main.py
from app.core.security_utils import SecurityHeaders

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    for key, value in SecurityHeaders.get_headers().items():
        response.headers[key] = value
    
    return response
```

### Step 7: Update Environment Variables

Add to `.env`:
```bash
# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_AUTH_PER_MINUTE=10

# Security
JWT_SECRET_CURRENT=your_new_strong_secret_here
JWT_SECRET_PREVIOUS=your_old_secret_for_rotation
ENABLE_CSRF_PROTECTION=true
```

### Step 8: Test Backend

```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#$"}'
```

---

## 📱 Mobile Migration

### Step 1: Install Dependencies

```bash
cd mobile
npm install expo-secure-store
```

### Step 2: Update Auth Store

```typescript
// In store/useAuthStore.ts
import { create } from 'zustand';
import { secureStorage } from '@/utils/secureStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User | null, token: string | null, refreshToken: string | null) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,
  
  setAuth: async (user, token, refreshToken) => {
    set({ user, token, refreshToken });
    
    if (user && token && refreshToken) {
      await secureStorage.saveTokens({ accessToken: token, refreshToken });
      await secureStorage.saveUser(user);
    }
  },
  
  logout: async () => {
    await secureStorage.clearAll();
    set({ user: null, token: null, refreshToken: null });
  },
  
  loadAuth: async () => {
    try {
      const tokens = await secureStorage.getTokens();
      const user = await secureStorage.getUser();
      
      if (tokens && user) {
        set({ user, token: tokens.accessToken, refreshToken: tokens.refreshToken });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

### Step 3: Load Auth on App Start

```typescript
// In App.tsx
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export default function App() {
  const loadAuth = useAuthStore(state => state.loadAuth);
  const isLoading = useAuthStore(state => state.isLoading);
  
  useEffect(() => {
    loadAuth();
  }, []);
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  return <RootNavigator />;
}
```

### Step 4: Update Login/Register Screens

```typescript
// In LoginScreen.tsx
const handleLogin = async () => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    // Save to secure storage
    await setAuth(
      response.data.user,
      response.data.access_token,
      response.data.refresh_token
    );
    
    navigation.navigate('Main');
  } catch (error) {
    // Handle error
  }
};
```

### Step 5: Wrap App with Error Boundary

```typescript
// In App.tsx or RootNavigator.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App error:', error, errorInfo);
        // TODO: Send to Sentry
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### Step 6: Optimize FlatLists

```typescript
// In HomeScreen.tsx
import { OPTIMIZED_FLATLIST_PROPS, createKeyExtractor } from '@/utils/performance';

const TASK_ITEM_HEIGHT = 80;

<FlatList
  data={tasks}
  renderItem={renderTask}
  keyExtractor={createKeyExtractor('task')}
  {...OPTIMIZED_FLATLIST_PROPS}
  getItemLayout={(data, index) => ({
    length: TASK_ITEM_HEIGHT,
    offset: TASK_ITEM_HEIGHT * index,
    index,
  })}
/>
```

Repeat for:
- `GroupDetailScreen.tsx` (messages list)
- `StatsScreen.tsx` (any lists)
- Any other screens with FlatList

### Step 7: Update Message Polling

```typescript
// In GroupDetailScreen.tsx
import { SmartPoller } from '@/utils/performance';
import { useRef, useEffect } from 'react';

const GroupDetailScreen = () => {
  const pollerRef = useRef(new SmartPoller(60000));
  
  const { data: messages, refetch } = useQuery({
    queryKey: ['group-messages', groupId],
    queryFn: () => fetchMessages(groupId),
    refetchInterval: false, // Disable auto-refetch
  });
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const poll = () => {
      refetch();
      const interval = pollerRef.current.getInterval();
      timeoutId = setTimeout(poll, interval);
    };
    
    poll();
    
    return () => clearTimeout(timeoutId);
  }, [refetch]);
  
  const handleNewMessage = () => {
    pollerRef.current.markActivity();
  };
  
  // ...
};
```

### Step 8: Test Mobile

```bash
# Clear cache and restart
cd mobile
npx expo start --clear

# Test on device
# - Login/logout
# - Token persistence (close and reopen app)
# - FlatList scrolling
# - Error boundary (trigger an error)
# - Message polling
```

---

## ✅ Verification Checklist

### Backend
- [ ] All service functions use `run_in_db_thread`
- [ ] Rate limiting works (test with rapid requests)
- [ ] Account lockout works (test with wrong password 5 times)
- [ ] Security headers present in responses
- [ ] Input sanitization working (test with HTML/scripts)
- [ ] Database migration successful
- [ ] No blocking queries in async routes

### Mobile
- [ ] Tokens stored in SecureStore (check with device inspector)
- [ ] Tokens persist across app restarts
- [ ] FlatList scrolls smoothly at 60 FPS
- [ ] Message polling slows down when inactive
- [ ] Error boundary catches errors
- [ ] No AsyncStorage used for tokens
- [ ] Login/logout works correctly

---

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `run_in_db_thread` not found
```bash
# Make sure file exists
ls backend/app/utils/async_db.py

# Restart server
pkill -f uvicorn
uvicorn app.main:app --reload
```

**Issue**: Migration fails
```bash
# Check current revision
cd backend && alembic current

# Downgrade and retry
alembic downgrade -1
alembic upgrade head
```

**Issue**: Rate limiting not working
```bash
# Check Redis connection
redis-cli ping

# Check Redis URL in .env
echo $REDIS_URL
```

### Mobile Issues

**Issue**: SecureStore not found
```bash
# Install dependency
cd mobile && npm install expo-secure-store

# Clear cache
npx expo start --clear
```

**Issue**: Tokens not persisting
```typescript
// Add debug logging
const loadAuth = async () => {
  const tokens = await secureStorage.getTokens();
  console.log('Loaded tokens:', tokens ? 'Found' : 'Not found');
  // ...
};
```

**Issue**: FlatList still laggy
```typescript
// Check if props are applied
<FlatList
  {...OPTIMIZED_FLATLIST_PROPS}
  onScrollBeginDrag={() => console.log('Scrolling')}
  // Add more debug props
/>
```

---

## 📊 Performance Testing

### Backend Load Test

```bash
# Install Apache Bench
brew install apache-bench  # macOS

# Test endpoint
ab -n 1000 -c 10 http://localhost:8000/api/v1/tasks/
```

Expected results:
- Requests per second: > 100
- Time per request: < 100ms
- Failed requests: 0

### Mobile Performance Test

1. **FPS Test**: Scroll through long list, should maintain 55+ FPS
2. **Memory Test**: Use Xcode Instruments, should stay < 150MB
3. **Battery Test**: Leave app open for 1 hour, battery drain < 5%
4. **Network Test**: Enable slow 3G, app should remain responsive

---

## 🚀 Deployment

### Backend

```bash
# 1. Run tests
cd backend && pytest

# 2. Run migrations
alembic upgrade head

# 3. Update environment variables
# Set strong JWT secrets
# Enable rate limiting
# Configure Redis

# 4. Deploy
# (Your deployment process here)
```

### Mobile

```bash
# 1. Update API URL
# Edit mobile/.env
EXPO_PUBLIC_API_URL=https://your-production-api.com/api/v1

# 2. Build
cd mobile
eas build --platform ios
eas build --platform android

# 3. Submit
eas submit --platform ios
eas submit --platform android
```

---

## 📝 Rollback Plan

If something goes wrong:

### Backend
```bash
# Rollback migration
cd backend && alembic downgrade -1

# Revert code
git revert HEAD

# Restart server
systemctl restart consistency-api
```

### Mobile
```bash
# Revert code
git revert HEAD

# Rebuild and redeploy
eas build --platform all
```

---

## 🎉 Success Criteria

You've successfully migrated when:

1. ✅ All tests pass
2. ✅ No console errors
3. ✅ Rate limiting works
4. ✅ Account lockout works
5. ✅ Tokens persist across restarts
6. ✅ FlatList scrolls smoothly
7. ✅ Message polling adapts to activity
8. ✅ Error boundary catches errors
9. ✅ Security headers present
10. ✅ Input sanitization working

---

## 📞 Need Help?

1. Check error logs: `tail -f backend/logs/app.log`
2. Check mobile logs: React Native debugger
3. Review `QUICK_REFERENCE.md` for patterns
4. Review `IMPLEMENTATION_SUMMARY.md` for details

---

**Estimated Migration Time**: 4-6 hours
**Difficulty**: Medium
**Risk Level**: Low (all changes are additive)

Good luck! 🚀
