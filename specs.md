# Consistency App — Master Specification
> Last updated: April 2026
> Status: Phase 1 — MVP Complete | Phase 2 — Starting

---

## What This App Is

Not a task manager. Not a habit tracker.

> An **AI-powered behavior system** that lives on the user's phone — tracks consistency, rewards discipline, and adapts to the user over time.

Think: Duolingo's engagement loop + Habitica's gamification + a personal AI coach — all in one clean mobile app.

---

## The Core Idea

Most productivity apps fail because they treat tasks as checkboxes. This app treats tasks as **behavior data**. Every completion, skip, delay, and pattern is logged and fed into an AI layer that adjusts difficulty, suggests better schedules, and keeps the user engaged through streaks, XP, and rewards.

---

## Vision Pillars

| Pillar | What It Means | Status |
|---|---|---|
| Offline-first | Works without internet, syncs when back online | ✅ SQLite implemented |
| AI-invisible | AI feels like the app is smart, not a separate feature | ✅ Rule engine live |
| Gamified | Streaks, XP, levels, coins — real engagement loops | ✅ Live |
| Mobile-native | Haptics, notifications, background sync | 🔄 Phase 2 |
| Behavior-driven | Every action is logged for future AI improvement | ✅ activity_logs table |

---

## Tech Stack (Locked In)

### Frontend — Mobile
| Tool | Version | Purpose | Status |
|---|---|---|---|
| React Native (Expo) | SDK 54 | Mobile app framework | ✅ Running |
| TypeScript | ~5.9 | Type safety | ✅ |
| Zustand | ^5.0 | UI / auth state | ✅ |
| TanStack React Query | ^5.0 | Server state, caching | ✅ |
| React Navigation | ^7.0 | Stack + bottom tabs | ✅ |
| Axios | ^1.15 | HTTP client + JWT interceptor | ✅ |
| Expo SQLite | ~16.0 | Offline local DB | ✅ |
| AsyncStorage | ^3.0 | Theme persistence | ✅ |
| @expo/vector-icons | ^15.1 | Ionicons throughout app | ✅ |
| Expo Notifications | ~0.32 | Push notifications | 🔄 Phase 2 |
| React Native Reanimated | ~4.1 | Micro-animations | 🔄 Phase 2 |
| babel-plugin-module-resolver | ^5.0 | `@/` path aliases → `src/` | ✅ |

### Backend
| Tool | Version | Purpose | Status |
|---|---|---|---|
| FastAPI | 0.111 | API framework | ✅ Running on :8000 |
| Python | 3.9 | Runtime | ✅ |
| SQLAlchemy | 2.0 | ORM | ✅ |
| PyMySQL | 1.1 | MySQL driver | ✅ |
| Pydantic v2 | 2.x | Schema validation | ✅ |
| python-jose | 3.3 | JWT tokens | ✅ |
| passlib + bcrypt | 1.7.4 + 4.0.1 | Password hashing (pinned) | ✅ |
| Redis | 5.0 | Cache + task queues | ✅ Container running |
| Celery | 5.4 | Background jobs | 🔄 Phase 2 |
| Uvicorn | 0.29 | ASGI server | ✅ |
| pydantic-settings | 2.2.1 | .env config loading | ✅ |

### Infrastructure
| Tool | Purpose | Status |
|---|---|---|
| Docker + Docker Compose | MySQL + Redis containers | ✅ Running |
| MySQL 8.0 | Primary database on :3306 | ✅ Healthy |
| Redis 7 | Cache + Celery broker on :6379 | ✅ Running |

### Planned (Phase 2+)
- Firebase Cloud Messaging — push notifications
- AWS S3 / Cloudinary — image/proof uploads
- Alembic — DB migrations
- WebSockets — real-time updates

---

## Architecture

```
Mobile App (React Native + Expo SDK 54)
    │  HTTP / REST (Axios + JWT interceptor + token rotation)
    │  Background Fetch (Expo Background Fetch — 15 min interval)
    ↓
API Layer (FastAPI — /api/v1/)
    │  Rate limiting: 60 req/min per user, 10 req/min for auth
    │  CORS: env-configurable via CORS_ORIGINS
    ↓
Services Layer (auth_service, task_service, ai_service)
    │  Redis cache: dashboard (2 min TTL), tasks (5 min TTL)
    │  Idempotency: all mutations keyed by idempotency_key
    ↓
MySQL 8.0 (persistent) + Redis 7 (cache + Celery broker)
    ↓
Celery Workers
    ├── ai queue:            compute_behavior_scores (hourly) + compute_behavior_scores_for_task (on completion)
    └── notifications queue: send_streak_reminder (daily)
```

### Mobile Clean Architecture
```
Presentation Layer  →  screens/, components/ (ErrorBoundary, XPGainToast)
Animation Layer     →  Reanimated (TaskCard bounce, XP float)
Haptics Layer       →  expo-haptics (Medium on complete)
State Layer         →  ThemeContext + Zustand + React Query (optimistic updates)
Domain Layer        →  hooks/useTasks.ts (offline-aware mutations)
Data Layer          →  services/api.ts + db/localDB.ts + syncEngine.ts
Background Layer    →  services/backgroundSync.ts (Expo Background Fetch)
```

### Event Flow: Task Completion
```
User taps Complete
    → Haptic feedback (ImpactFeedbackStyle.Medium)
    → Card scale bounce animation (Reanimated)
    → Optimistic UI update (streak+1, xp+10 in React Query cache)
    → If offline: queue to SQLite pending_actions
    → If online: POST /tasks/{id}/complete with idempotency_key
        → Server: update streak + XP + consistency_index
        → Server: Celery.delay(compute_behavior_scores_for_task)
        → Server: invalidate Redis cache for user
    → React Query invalidates dashboard + tasks
    → XPGainToast floats up with real XP value
```

### Sync Engine Flow
```
App foreground: NetInfo listener → on reconnect → flushPendingQueue()
App background: Expo Background Fetch → every 15 min → flushPendingQueue()
Batch sync: POST /tasks/sync/batch → server processes idempotently
Retry: max 3 attempts, mark failed after exhaustion
```

---

## Project Folder Structure

### Mobile (`mobile/`)
```
mobile/
├── App.tsx                         # Root — ThemeProvider + QueryClient + DB init + Navigator
├── index.ts                        # Expo entry point
├── babel.config.js                 # @/ path aliases via babel-plugin-module-resolver
├── metro.config.js                 # Metro bundler config
├── tsconfig.json                   # TS config with baseUrl + paths
├── .env                            # EXPO_PUBLIC_API_URL (gitignored)
├── .env.example                    # Template for new devs
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx       # Auth stack + bottom tab navigator (5 tabs)
    ├── constants/
    │   └── theme.ts                # darkColors, lightColors, spacing, radius, font, shadow
    ├── store/
    │   ├── ThemeContext.tsx         # Dark/Light/System theme + AsyncStorage persistence
    │   └── useAuthStore.ts         # Zustand — user + token
    ├── services/
    │   └── api.ts                  # Axios instance + JWT interceptor
    ├── db/
    │   └── localDB.ts              # SQLite v16 async API — tasks cache + pending sync queue
    ├── components/
    │   ├── ScreenWrapper.tsx        # Safe area + status bar + theme bg
    │   ├── Button.tsx               # primary / ghost / danger / surface variants
    │   ├── Input.tsx                # Label + left/right icon + error state
    │   ├── TaskCard.tsx             # Difficulty color bar + Ionicons + complete button
    │   └── StatCard.tsx             # Icon wrap + value + label, theme-aware
    └── features/
        ├── auth/
        │   ├── api.ts               # register / login API calls
        │   └── screens/
        │       ├── LoginScreen.tsx  # Email/pass + show/hide + error box + nav to Register
        │       └── RegisterScreen.tsx # Name/email/pass + validation + nav to Login
        ├── tasks/
        │   ├── api.ts               # getAll / create / complete / getDashboard
        │   ├── types.ts             # Task, TaskCreate, Dashboard interfaces
        │   ├── hooks/
        │   │   └── useTasks.ts      # useDashboard, useTasks, useCreateTask, useCompleteTask
        │   └── screens/
        │       ├── HomeScreen.tsx   # Greeting, streak card, XP bar, stats row, AI insight, task list
        │       ├── CreateTaskScreen.tsx # Title, desc, difficulty picker, schedule selector, XP preview
        │       └── StatsScreen.tsx  # Level card, XP progress, streak stats, milestones, AI suggestions
        └── profile/
            └── screens/
                └── ProfileScreen.tsx # Avatar, stats, theme switcher, notifications, account, settings, logout
```

### Backend (`backend/`)
```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, auto table creation on startup
│   ├── core/
│   │   ├── config.py          # pydantic-settings — reads .env
│   │   └── security.py        # JWT encode/decode, bcrypt hash/verify
│   ├── db/
│   │   └── session.py         # SQLAlchemy engine + SessionLocal + Base + get_db()
│   ├── models/
│   │   └── models.py          # All 7 SQLAlchemy models
│   ├── schemas/
│   │   └── schemas.py         # Pydantic DTOs — UserCreate, Token, TaskOut, DashboardOut
│   ├── services/
│   │   ├── auth_service.py    # register + login — creates user + streak + user_stats rows
│   │   ├── task_service.py    # CRUD + complete + streak update + XP update + dashboard
│   │   └── ai_service.py      # difficulty adjust, XP calc, streak logic, suggestions
│   ├── api/v1/
│   │   ├── auth.py            # POST /register, POST /login
│   │   ├── tasks.py           # GET /, POST /, POST /{id}/complete
│   │   └── stats.py           # GET /dashboard
│   ├── utils/
│   │   └── deps.py            # get_current_user — Bearer token → User
│   └── workers/               # Celery tasks (Phase 2)
├── .env                       # Secrets (gitignored)
├── .env.example               # Template for new devs
├── requirements.txt           # All Python deps with pinned versions
├── docker-compose.yml         # MySQL 8 + Redis 7 containers
├── schema.sql                 # Raw SQL schema for reference / manual setup
└── seed_users.py              # Seeds 3 test users (alice, bob, charlie)
```

---

## Database Schema

### 7 Tables — All Live in MySQL

```sql
users           — id, email, password_hash, name, goal, timezone, created_at
tasks           — id, user_id, title, description, difficulty(1-5), estimated_minutes, schedule_type, is_active
task_schedules  — id, task_id, day_of_week, time_of_day
task_completions— id, task_id, user_id, completed_at, duration_minutes, proof_url, status
streaks         — user_id (PK), current_streak, longest_streak, last_completed_date
user_stats      — user_id (PK), xp, level, coins
activity_logs   — id, user_id, action_type, meta(JSON), created_at
```

### Current DB State (April 2026)
| Table | Rows |
|---|---|
| users | 3 (alice, bob, charlie) |
| tasks | 2 |
| task_completions | 2 |
| streaks | 3 |
| user_stats | 3 |

### Key Design Decisions
- `task_completions` is append-only → analytics goldmine
- `activity_logs.meta` is JSON → flexible AI data capture
- `user_stats` is separate → avoids heavy joins on hot paths
- `task_schedules` enables flexible recurrence without bloating tasks table
- All tables auto-created on backend startup via `Base.metadata.create_all()`
- `metadata` column renamed to `meta` — reserved word in SQLAlchemy

---

## API Endpoints

### Auth
```
POST /api/v1/auth/register   → { access_token, user }
POST /api/v1/auth/login      → { access_token, user }
```

### Tasks
```
GET  /api/v1/tasks/              → list of user's active tasks
POST /api/v1/tasks/              → create task
POST /api/v1/tasks/{id}/complete → complete task (updates streak + XP + activity_log)
```

### Stats
```
GET /api/v1/stats/dashboard  → { tasks, streak, xp, level, suggestions }
```

### System
```
GET /health  → { status: "ok" }
GET /docs    → Swagger UI (interactive)
GET /redoc   → ReDoc UI
```

---

## Theme System

### 3 Modes
| Mode | Behavior |
|---|---|
| `dark` | Always dark — `darkColors` palette |
| `light` | Always light — `lightColors` palette |
| `system` | Follows device setting via `useColorScheme()` |

### Implementation
- `ThemeContext.tsx` — React context with `mode`, `colors`, `isDark`, `setMode`
- Persisted to `AsyncStorage` under key `@theme_mode`
- Loads saved preference on app start
- All components consume `useTheme()` — zero hardcoded colors anywhere
- Switchable live from Profile → Settings → Appearance

### Color Tokens (both palettes)
```
bg, surface, card, cardAlt, border, borderLight
primary, primaryDim, primaryBorder
green, greenDim | yellow, yellowDim | blue, blueDim | purple, purpleDim | red, redDim
text, textSub, textMuted, textDim
overlay
```

---

## Screens

### Auth Stack (unauthenticated)
| Screen | File | Features |
|---|---|---|
| Login | `auth/screens/LoginScreen.tsx` | Email + password, show/hide toggle, error box with icon, nav to Register |
| Register | `auth/screens/RegisterScreen.tsx` | Name + email + password, validation, back button, nav to Login |

### Main Tab Navigator (authenticated — 5 tabs)
| Tab | Screen | File | Features |
|---|---|---|---|
| Home | HomeScreen | `tasks/screens/HomeScreen.tsx` | Greeting, streak card, XP bar, stats row, AI insight box, task list with complete button, empty state |
| Stats | StatsScreen | `tasks/screens/StatsScreen.tsx` | Level card, XP progress bar, streak stats, AI suggestions, 7 milestones with lock/unlock |
| + (center) | CreateTaskScreen | `tasks/screens/CreateTaskScreen.tsx` | Title, description, estimated minutes, difficulty picker (5 levels with icons), schedule selector, XP preview |
| Activity | StatsScreen | (reused) | Same as Stats tab |
| Profile | ProfileScreen | `profile/screens/ProfileScreen.tsx` | Avatar, stats row, theme switcher (3 modes), notification toggles, account info, app info, danger zone, logout |

### Shared Components
| Component | Purpose |
|---|---|
| `ScreenWrapper` | Safe area + status bar + theme background |
| `Button` | 4 variants: primary / ghost / danger / surface, loading state, icon support |
| `Input` | Label, left icon, right icon, error state, theme-aware |
| `TaskCard` | Difficulty color bar, schedule icon, time, complete button with loading |
| `StatCard` | Icon wrap, colored value, label — used in Home stats row |

---

## AI Engine (Phase 2 — Behavior Scoring System)

All in `backend/app/services/ai_service.py`

### Consistency Index (0–100)
Weighted score across 4 signals, stored in `user_stats.consistency_index`:
```python
index = (rate_7d * 40)      # 7-day completion rate  — 40% weight
      + (rate_30d * 30)     # 30-day completion rate — 30% weight
      + (streak_score * 20) # streak health          — 20% weight
      + (recency * 10)      # completed in last 24h  — 10% weight
# Result: 0.0 – 100.0, rounded to 2 decimal places
```

### Per-Task Behavior Score (stored in `behavior_scores` table)
```python
success_rate          = completions / expected_completions  # capped at 1.0
avg_completion_hour   = mean(completed_at.hour) over all completions
avg_duration_minutes  = mean(duration_minutes) over completions with duration
predicted_success_prob = recent_30d_rate clamped to [0.05, 0.95]
recommended_difficulty = _adaptive_difficulty(current, success_rate, avg_duration)
```

### Adaptive Difficulty Model
```python
delta = 0
if success_rate > 0.85: delta += 1   # too easy
elif success_rate < 0.35: delta -= 1  # too hard
if avg_duration / expected < 0.7: delta += 1   # completing much faster
elif avg_duration / expected > 1.5: delta -= 1  # taking much longer
return max(1, min(5, current + delta))
```

### XP Formula
```python
xp = (difficulty * 10)              # base
   + min(streak * 2, 50)            # streak bonus (capped at 50)
   + int(consistency_index * 0.5)   # consistency bonus (0–50)
   + (10 if faster_than_estimated)  # speed bonus
```

### AI Insights Engine
Generates prioritized `{type, message, priority}` list:
- `priority 1` (high): streak at risk (>20h since last completion), low consistency (<30)
- `priority 2` (medium): high fail rate (>50%), best hour scheduling suggestion
- `priority 3` (low): achievement unlocked (CI ≥ 80), best day suggestion

### Computation Triggers
- On task completion → `compute_behavior_scores_for_task.delay(user_id, task_id)` (immediate, async)
- Hourly Celery beat → `compute_behavior_scores` (all active tasks, all users)
- Dashboard request → reads pre-computed `behavior_scores` table (no live computation)

### Phase 3 AI Upgrades (Planned)
- Replace rule engine with scikit-learn logistic regression trained on `activity_logs`
- Smart notification timing based on `avg_completion_hour` per user
- Weekly AI insight report (Celery beat, Sunday 9am)
- Task success probability shown in CreateTask screen before saving

---

## Offline-First Strategy

### Local SQLite DB (`src/db/localDB.ts`)
Uses expo-sqlite v16 async API (`openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`)
```
tables:
  tasks              — server cache (replaced on each sync)
  pending_actions    — offline mutation queue with retry tracking
  completions_cache  — local idempotency check for completions
```

### Pending Actions Schema
```sql
pending_actions (
  idempotency_key TEXT UNIQUE,  -- prevents duplicate processing
  action_type     TEXT,         -- create_task | complete_task | update_task
  payload         TEXT,         -- JSON
  status          TEXT,         -- pending | processed | failed
  retry_count     INTEGER,      -- incremented on each failure
  max_retries     INTEGER DEFAULT 3,
  last_attempted_at TEXT,
  error           TEXT
)
```

### Sync Triggers (3 paths)
1. **Foreground reconnect** — `NetInfo.addEventListener` → `flushPendingQueue()` on `isConnected=true`
2. **Background fetch** — `Expo Background Fetch` every 15 min → `flushPendingQueue()`
3. **Manual** — pull-to-refresh on HomeScreen triggers React Query refetch + sync

### Conflict Resolution Strategy
- `complete_task`: idempotency_key prevents double-completion — server returns `already_completed` status
- `create_task`: offline tasks get temp local IDs; on sync, server assigns real ID (reconciliation TODO Phase 3)
- `update_task`: last-write-wins using `client_timestamp` in `SyncAction` schema

### Retry Policy
- Max 3 retries per action
- After 3 failures: `status = 'failed'`, surfaced in `getFailedActions()`
- TODO Phase 3: exponential backoff (`2^retry_count * 30s`)

---

## State Management

### Zustand — UI/Auth State
```ts
useAuthStore → { user, token, setAuth, logout }
```

### ThemeContext — Theme State
```ts
useTheme() → { mode, colors, isDark, setMode }
```

### React Query — Server State
```ts
useDashboard()     → GET /stats/dashboard  (staleTime: 60s, retry: 2)
useTasks()         → GET /tasks
useCreateTask()    → POST /tasks           (invalidates tasks + dashboard)
useCompleteTask()  → POST /tasks/{id}/complete (invalidates tasks + dashboard)
```

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consistency_db
JWT_SECRET=change_this_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_AUTH_PER_MINUTE=10
CORS_ORIGINS=["exp://192.168.1.19:8082","http://localhost:8082"]
```

### Mobile (`mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://192.168.1.19:8000/api/v1
```
> Use Mac's LAN IP — physical devices cannot reach `localhost`

### Running Migrations
```bash
cd backend
source venv/bin/activate
alembic upgrade head   # run BEFORE starting the server
```

---

## Running the App

### Start Infrastructure
```bash
cd backend
docker compose up -d
# MySQL on :3306, Redis on :6379
```

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
# API:   http://localhost:8000
# Docs:  http://localhost:8000/docs
# Check: http://localhost:8000/health
```

### Start Mobile
```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.19 npx expo start --clear --port 8082 --lan
# Open Expo Go on phone → Enter URL: exp://192.168.1.19:8082
```

### Seed Test Users
```bash
cd backend
source venv/bin/activate
pip install bcrypt==4.0.1   # required — passlib compatibility
python seed_users.py
```

### Test Credentials
| Email | Password | Name |
|---|---|---|
| alice@test.com | password123 | Alice |
| bob@test.com | password123 | Bob |
| charlie@test.com | password123 | Charlie |

---

## Database Access

### Option 1 — TablePlus GUI (Recommended)
Download: https://tableplus.com
```
Host:     127.0.0.1
Port:     3306
User:     root
Password: password
Database: consistency_db
```

### Option 2 — Terminal via Docker
```bash
docker exec -it consistency_mysql mysql -uroot -ppassword consistency_db
```
```sql
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM tasks;
SELECT * FROM streaks;
SELECT * FROM user_stats;
```

### Option 3 — VS Code Extension
Install "MySQL" by cweijan → same credentials as above

---

## Git & GitHub

### Repository
```
https://github.com/Shubhampathare04/Concistancy
```

### Push workflow
```bash
git add .
git commit -m "feat: your message"
git push origin main
```

### What's committed (67 files)
- Full backend (FastAPI + all services + models + schemas)
- Full mobile (all screens + components + navigation + theme)
- README.md with setup guide
- .env.example files (never commit real .env)
- docker-compose.yml
- requirements.txt
- schema.sql

---

## Known Issues & All Fixes Applied

| Issue | Root Cause | Fix Applied |
|---|---|---|
| `metadata` reserved by SQLAlchemy | SQLAlchemy uses `metadata` internally | Renamed column to `meta` in ActivityLog model |
| `date \| None` syntax error | Python 3.9 doesn't support union type `\|` syntax | Replaced with `Optional[date]` from `typing` |
| `list[TaskOut]` type error | Python 3.9 requires `List` from `typing` | Replaced with `List[TaskOut]` |
| `str \| None` in cache.py | Python 3.9 union syntax | Replaced with `Optional[str]` from `typing` |
| `babel-preset-expo` missing | Not installed by default in blank template | `npm install babel-preset-expo` |
| `@/` path alias not resolving | Metro doesn't support `resolver.alias` in this version | Added `babel-plugin-module-resolver` with `root: ['./src']` |
| Metro detecting `src/app` as Expo Router | Expo SDK 54 auto-detects `app/` folder | Renamed `src/app/` → `src/navigation/` |
| `expo-sqlite` v16 API change | v16 dropped sync API entirely | Rewrote `localDB.ts` using full async API |
| `bcrypt` version mismatch with passlib | bcrypt 5.x removed `__about__` attribute | Pinned `bcrypt==4.0.1` |
| Port 8000 address in use | Stale Python process from previous run | `lsof -ti:8000 \| xargs kill -9` |
| Phone can't reach `localhost:8000` | `localhost` resolves to phone itself on device | Set `EXPO_PUBLIC_API_URL` to Mac's LAN IP `192.168.1.19` |
| Docker socket not found | Docker Desktop uses non-standard socket path | Used `docker context use desktop-linux` |
| Expo port conflict on 8082 | Previous expo process still running | `pkill -f expo && pkill -f metro` |
| Mobile nested `.git` repo | Expo init creates its own git repo | Removed `mobile/.git`, re-added as regular directory |
| `complete(id)` call signature mismatch | `useCompleteTask` expects `{taskId}` object | Fixed HomeScreen to call `complete({ taskId: id })` |
| Token rotation not stored on mobile | `setToken` didn't accept refresh token | Updated `setToken(token, refreshToken?)` signature |
| `setAuth` missing `refresh_token` | Login/Register screens didn't pass it | Fixed both screens to pass `res.data.refresh_token` |
| `cache_delete_pattern` uses KEYS | KEYS blocks Redis at scale | Replaced with SCAN cursor loop |
| CORS hardcoded to `["*"]` | Not configurable per environment | Moved to `CORS_ORIGINS` env var in config |
| `create_all` in production | Dangerous — bypasses migration history | Removed; replaced with Alembic `upgrade head` |

---

## Development Phases

### Phase 1 — MVP ✅ Complete
- [x] Backend folder structure
- [x] Database schema (7 tables, all live)
- [x] JWT auth (register + login)
- [x] Task CRUD API
- [x] Task completion with streak + XP update
- [x] Dashboard aggregated endpoint
- [x] AI rule engine (difficulty, XP, suggestions)
- [x] Mobile folder structure (Clean Architecture)
- [x] Zustand auth store
- [x] React Query hooks (useDashboard, useTasks, useCreateTask, useCompleteTask)
- [x] Login screen (Ionicons, show/hide password, error handling)
- [x] Register screen (validation, back navigation)
- [x] Home screen (streak card, XP bar, stats row, AI insight, task list)
- [x] Create Task screen (difficulty picker, schedule selector, XP preview)
- [x] Stats screen (level card, XP progress, milestones)
- [x] Profile + Settings screen (theme switcher, notifications, account, logout)
- [x] Dark / Light / System theme engine (AsyncStorage persistence)
- [x] Bottom tab navigation (5 tabs with Ionicons)
- [x] SQLite offline DB + sync queue (expo-sqlite v16 async API)
- [x] Docker compose (MySQL 8 + Redis 7)
- [x] Test users seeded (alice, bob, charlie)
- [x] Pushed to GitHub (67 files)

### Phase 2 — UX + Gamification 🔄 In Progress
- [x] Haptic feedback on task completion (expo-haptics)
- [x] TaskCard scale bounce + check pop animation (Reanimated)
- [x] XPGainToast floating animation component
- [x] Background sync (Expo Background Fetch — 15 min)
- [x] AsyncStorage token persistence (survive app restart)
- [x] Redis caching on dashboard + tasks endpoints
- [x] Celery workers (behavior scores + streak reminders)
- [x] Edit / delete task (PATCH + soft delete)
- [x] Optimistic UI on task completion + delete
- [x] ErrorBoundary with retry UI
- [x] Token rotation on refresh (full end-to-end)
- [x] Alembic migrations setup
- [ ] Wire XPGainToast into HomeScreen onSuccess
- [ ] Level up modal with haptic + animation
- [ ] Streak fire pulse animation
- [ ] Push notifications via FCM + expo-notifications
- [ ] Weekly progress heatmap
- [ ] Coins reward system
- [ ] Sync status badge on Profile tab

### Phase 3 — AI Integration
- [ ] Smart task suggestions while typing
- [ ] Post-completion AI feedback
- [ ] Weekly AI insight report
- [ ] Difficulty auto-adjustment based on history
- [ ] Smart notification timing (based on user patterns)
- [ ] Replace rule engine with lightweight ML model

### Phase 4 — Advanced Mobile
- [ ] Full offline sync engine with conflict resolution
- [ ] Camera-based task proof verification
- [ ] GPS location-based tasks
- [ ] Leaderboards / social features
- [ ] Image upload (S3/Cloudinary)
- [ ] Production deployment (AWS ECS / Railway)
- [ ] expo-secure-store for encrypted token storage

---

## Performance Rules (Non-Negotiable)

| Rule | Target |
|---|---|
| First screen load | < 2 seconds |
| Dashboard API response | < 300ms |
| APK size | < 50MB |
| List rendering | FlatList only (never ScrollView + map) |
| Re-renders | Memoize heavy components |
| API calls per screen | Max 1 (use aggregated endpoints) |

---

## What NOT to Build Until Phase 3+

- ❌ Separate AI page/tab
- ❌ Social features
- ❌ Image verification
- ❌ Complex analytics dashboard
- ❌ Leaderboards
- ❌ Multiple user roles / admin panel

---

## The North Star

> If you build this as "a task app with streaks" → it will be forgotten.
>
> If you build this as **"an AI-powered behavior system that lives on the user's phone"** → it stands out.

Every feature decision should answer: *does this make the user more consistent?*
If yes → build it. If no → cut it.







┌─────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT                            │
│  React Native (Expo SDK 54) + TypeScript                    │
│  ├─ State: Zustand + TanStack React Query                   │
│  ├─ Navigation: React Navigation v7                          │
│  ├─ Offline: Expo SQLite + Sync Queue                       │
│  └─ Theme: Custom Context (Dark/Light/System)               │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND API                              │
│  FastAPI + Python 3.9                                        │
│  ├─ ORM: SQLAlchemy 2.0                                      │
│  ├─ Auth: JWT (python-jose + passlib/bcrypt)                │
│  ├─ Cache: Redis 7 (minimal usage)                          │
│  └─ Events: Custom event system (app/core/events.py)        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ├─ MySQL 8.0 (Primary DB)                                  │
│  ├─ Redis 7 (Cache + Rate Limiting)                         │
│  └─ Expo SQLite (Mobile Offline DB)                         │
└─────────────────────────────────────────────────────────────┘







USER ACTION (Mobile)
    ↓
[React Query Cache Check]
    ↓ (cache miss)
[API Request via axios]
    ↓
[FastAPI Route Handler]
    ↓
[Service Layer (business logic)]
    ↓
[SQLAlchemy ORM]
    ↓
[MySQL Database]
    ↓
[Redis Cache (selective)]
    ↓
[Response → React Query → UI Update]
    ↓
[Offline Queue (if network fails)]
