# Consistency App — Master Specification
> Last updated: April 2026
> Status: Phase 1 — MVP In Progress

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

| Pillar | What It Means |
|---|---|
| Offline-first | Works without internet, syncs when back online |
| AI-invisible | AI feels like the app is smart, not a separate feature |
| Gamified | Streaks, XP, levels, coins — real engagement loops |
| Mobile-native | Uses haptics, notifications, background sync — not a web app |
| Behavior-driven | Every action is logged for future AI improvement |

---

## Tech Stack (Final Decisions)

### Frontend — Mobile
| Tool | Version | Purpose |
|---|---|---|
| React Native (Expo) | SDK 54 | Mobile app framework |
| TypeScript | ~5.9 | Type safety |
| Zustand | ^5.0 | UI / auth state management |
| TanStack React Query | ^5.0 | Server state, caching, retries |
| React Navigation | ^7.0 | Stack + tab navigation |
| Axios | ^1.15 | HTTP client with JWT interceptor |
| Expo SQLite | ~16.0 | Local offline database |
| Expo Notifications | ~0.32 | Push notifications (Phase 2) |
| React Native Reanimated | ~4.1 | Micro-animations (Phase 2) |
| babel-plugin-module-resolver | latest | Path alias `@/` → `src/` |

### Backend
| Tool | Version | Purpose |
|---|---|---|
| FastAPI | 0.111 | API framework |
| Python | 3.9 | Runtime |
| SQLAlchemy | 2.0 | ORM |
| PyMySQL | 1.1 | MySQL driver |
| Pydantic v2 | 2.x | Schema validation |
| python-jose | 3.3 | JWT tokens |
| passlib + bcrypt 4.0.1 | fixed | Password hashing |
| Redis | 5.0 | Caching + task queues |
| Celery | 5.4 | Background jobs (Phase 2) |
| Uvicorn | 0.29 | ASGI server |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | MySQL + Redis containers |
| MySQL 8.0 | Primary database |
| Redis 7 | Cache + Celery broker |

### Planned (Phase 2+)
- Firebase Cloud Messaging — push notifications
- AWS S3 / Cloudinary — image/proof uploads
- Alembic — DB migrations
- WebSockets — real-time updates

---

## Architecture

```
Mobile App (React Native + Expo)
        ↓  HTTP / REST
API Layer (FastAPI — /api/v1/)
        ↓
Services Layer (auth, tasks, AI scoring)
        ↓
MySQL (persistent) + Redis (cache/queue)
        ↓
Celery Workers (background jobs — Phase 2)
```

### Mobile Clean Architecture
```
Presentation Layer  →  screens/, components/
State Layer         →  Zustand store + React Query
Domain Layer        →  hooks/, feature logic
Data Layer          →  services/api.ts + db/localDB.ts
```

---

## Project Folder Structure

### Mobile (`mobile/`)
```
mobile/
├── App.tsx                    # Root — QueryClient + DB init + Navigator
├── index.ts                   # Expo entry point
├── babel.config.js            # Path aliases (@/ → src/)
├── metro.config.js            # Metro bundler config
├── tsconfig.json              # TS config with baseUrl + paths
├── .env                       # EXPO_PUBLIC_API_URL=http://<MAC_IP>:8000/api/v1
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx  # Auth-gated stack navigator
    ├── features/
    │   ├── auth/
    │   │   ├── api.ts         # register / login API calls
    │   │   └── screens/
    │   │       └── LoginScreen.tsx
    │   ├── tasks/
    │   │   ├── api.ts         # getAll / create / complete / getDashboard
    │   │   ├── types.ts       # Task, TaskCreate, Dashboard interfaces
    │   │   ├── hooks/
    │   │   │   └── useTasks.ts  # useDashboard, useTasks, useCreateTask, useCompleteTask
    │   │   └── screens/
    │   │       └── HomeScreen.tsx
    │   ├── streaks/           # Phase 2
    │   ├── rewards/           # Phase 2
    │   └── profile/           # Phase 2
    ├── store/
    │   └── useAuthStore.ts    # Zustand — user + token
    ├── services/
    │   └── api.ts             # Axios instance + JWT interceptor
    ├── db/
    │   └── localDB.ts         # SQLite — cache tasks + pending sync queue
    ├── components/            # Shared UI (Phase 2)
    ├── hooks/                 # Global hooks (Phase 2)
    ├── utils/                 # Helpers (Phase 2)
    └── constants/             # App-wide constants (Phase 2)
```

### Backend (`backend/`)
```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, auto table creation
│   ├── core/
│   │   ├── config.py          # pydantic-settings — reads .env
│   │   └── security.py        # JWT encode/decode, bcrypt hash/verify
│   ├── db/
│   │   └── session.py         # SQLAlchemy engine + SessionLocal + Base
│   ├── models/
│   │   └── models.py          # All 7 SQLAlchemy table models
│   ├── schemas/
│   │   └── schemas.py         # Pydantic DTOs (UserCreate, Token, TaskOut, DashboardOut)
│   ├── services/
│   │   ├── auth_service.py    # register + login logic
│   │   ├── task_service.py    # CRUD + complete + dashboard + streak + XP
│   │   └── ai_service.py      # difficulty adjust, XP calc, streak logic, suggestions
│   ├── api/v1/
│   │   ├── auth.py            # POST /register, POST /login
│   │   ├── tasks.py           # GET /, POST /, POST /{id}/complete
│   │   └── stats.py           # GET /dashboard
│   ├── utils/
│   │   └── deps.py            # get_current_user dependency
│   └── workers/               # Celery tasks (Phase 2)
├── .env                       # DB URL, JWT secret, Redis URL
├── requirements.txt
├── docker-compose.yml         # MySQL 8 + Redis 7 containers
├── schema.sql                 # Raw SQL schema for reference
└── seed_users.py              # Test user seeder
```

---

## Database Schema

### 7 Tables — All Created

```sql
users           — id, email, password_hash, name, goal, timezone, created_at
tasks           — id, user_id, title, description, difficulty(1-5), estimated_minutes, schedule_type, is_active
task_schedules  — id, task_id, day_of_week, time_of_day  (recurring logic)
task_completions— id, task_id, user_id, completed_at, duration_minutes, proof_url, status
streaks         — user_id (PK), current_streak, longest_streak, last_completed_date
user_stats      — user_id (PK), xp, level, coins
activity_logs   — id, user_id, action_type, meta(JSON), created_at
```

### Key Design Decisions
- `task_completions` is append-only → analytics goldmine
- `activity_logs.meta` is JSON → flexible AI data capture
- `user_stats` is separate → avoids heavy joins on hot paths
- `task_schedules` enables flexible recurrence without bloating tasks table
- All tables auto-created on backend startup via `Base.metadata.create_all()`

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
POST /api/v1/tasks/{id}/complete → complete task (updates streak + XP)
```

### Stats
```
GET /api/v1/stats/dashboard  → { tasks, streak, xp, level, suggestions }
```

### System
```
GET /health  → { status: "ok" }
GET /docs    → Swagger UI
```

---

## AI Logic (Phase 1 — Rule-Based)

All in `backend/app/services/ai_service.py`

### Difficulty Adjustment
```python
# Baseline 3, adjust ±1 based on success rate and time
score += 1 if success_rate > 0.8 else (-1 if success_rate < 0.4 else 0)
score += 1 if avg_time < expected_time else -1
return max(1, min(5, score))
```

### XP Calculation
```python
xp = difficulty * 10 + consistency_bonus
# consistency_bonus = current streak count
```

### Streak Logic
```python
delta = (today - last_completed_date).days
# delta == 1 → increment
# delta == 0 → no change (already done today)
# delta > 1  → reset to 1
```

### Suggestions (Rule Engine)
```python
if fail_rate > 0.5:   → "Consider reducing task difficulty"
if best_hour exists:  → "You perform best around {hour}:00"
```

### Phase 3 AI Upgrades (Planned)
- Replace rule engine with lightweight ML model
- Use `activity_logs` as training data
- Smart notification timing based on completion patterns
- Weekly AI-generated insight reports

---

## Offline-First Strategy

### Local SQLite DB (`src/db/localDB.ts`)
```
tables:
  tasks           — cached from server
  pending_actions — queue of offline actions
```

### Sync Flow
```
User action (offline)
    → save to SQLite
    → add to pending_actions queue
    → when online: flush queue to server
    → mark as synced
```

### Pending Action Types
- `create_task`
- `complete_task`
- `update_task`

---

## State Management

### Zustand — UI/Auth State
```ts
useAuthStore → { user, token, setAuth, logout }
```
- Persists token in memory (Phase 2: add AsyncStorage persistence)

### React Query — Server State
```ts
useDashboard()     → GET /stats/dashboard
useTasks()         → GET /tasks
useCreateTask()    → POST /tasks
useCompleteTask()  → POST /tasks/{id}/complete
```
- Auto-invalidates dashboard + tasks on mutation
- 60s stale time, 2 retries

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consistency_db
JWT_SECRET=change_this_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REDIS_URL=redis://localhost:6379/0
```

### Mobile (`mobile/.env`)
```
EXPO_PUBLIC_API_URL=http://192.168.1.19:8000/api/v1
```
> Use Mac's LAN IP (not localhost) so physical device can reach the backend

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
# API at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Start Mobile
```bash
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.19 npx expo start --clear --port 8082 --lan
# Scan QR with Expo Go app on phone
# Or press 'i' for iOS simulator
```

### Test Users (seeded)
| Email | Password | Name |
|---|---|---|
| alice@test.com | password123 | Alice |
| bob@test.com | password123 | Bob |
| charlie@test.com | password123 | Charlie |

---

## Known Issues & Fixes Applied

| Issue | Fix |
|---|---|
| `metadata` reserved by SQLAlchemy | Renamed column to `meta` in ActivityLog |
| `date \| None` syntax (Python 3.9) | Replaced with `Optional[date]` from typing |
| `list[TaskOut]` (Python 3.9) | Replaced with `List[TaskOut]` from typing |
| `babel-preset-expo` missing | Installed explicitly |
| `@/` path alias not resolving | Added `babel-plugin-module-resolver` with root `./src` |
| Metro detecting `src/app` as Expo Router | Renamed to `src/navigation/` |
| `expo-sqlite` v16 API change | Rewrote `localDB.ts` using async API |
| `bcrypt` version mismatch with passlib | Pinned `bcrypt==4.0.1` |
| Port 8000 address in use | Kill stale Python process with `lsof -ti:8000 \| xargs kill -9` |
| Phone can't reach `localhost:8000` | Set `EXPO_PUBLIC_API_URL` to Mac's LAN IP `192.168.1.19` |

---

## Development Phases

### Phase 1 — MVP (Current)
- [x] Backend folder structure
- [x] Database schema (7 tables)
- [x] JWT auth (register + login)
- [x] Task CRUD API
- [x] Task completion with streak + XP update
- [x] Dashboard aggregated endpoint
- [x] AI rule engine (difficulty, XP, suggestions)
- [x] Mobile folder structure
- [x] Zustand auth store
- [x] React Query hooks
- [x] Login screen
- [x] Home screen (streak, XP, task list, complete button)
- [x] SQLite offline DB + sync queue
- [x] Docker compose (MySQL + Redis)
- [x] Test users seeded
- [ ] Register screen
- [ ] Create task screen
- [ ] Expo Go running on physical device (in progress — bundle errors being fixed)

### Phase 2 — UX + Gamification
- [ ] Haptic feedback on task completion
- [ ] Micro-animations (XP gain, streak fire) via Reanimated
- [ ] Push notifications via FCM + expo-notifications
- [ ] Background sync (Expo Background Fetch)
- [ ] Progress dashboard screen (heatmap, weekly chart)
- [ ] Profile screen
- [ ] Tab navigation (Home / Dashboard / Profile)
- [ ] AsyncStorage token persistence (survive app restart)
- [ ] Redis caching on dashboard endpoint
- [ ] Celery workers for background jobs

### Phase 3 — AI Integration
- [ ] Smart task suggestions while typing
- [ ] Post-completion AI feedback
- [ ] Weekly AI insight report
- [ ] Difficulty auto-adjustment based on history
- [ ] Smart notification timing (based on user patterns)
- [ ] Replace rule engine with lightweight ML model

### Phase 4 — Advanced Mobile
- [ ] Full offline sync engine
- [ ] Camera-based task proof verification
- [ ] GPS location-based tasks
- [ ] Leaderboards / social features
- [ ] Image upload (S3/Cloudinary)
- [ ] Alembic DB migrations
- [ ] Production deployment (AWS/Railway)

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
- ❌ Multiple user roles/admin panel

---

## The North Star

> If you build this as "a task app with streaks" → it will be forgotten.
>
> If you build this as **"an AI-powered behavior system that lives on the user's phone"** → it stands out.

Every feature decision should answer: *does this make the user more consistent?*
If yes → build it. If no → cut it.
