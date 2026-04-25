# Consistency App

> An AI-powered behavior system that lives on your phone — tracks consistency, rewards discipline, and adapts to you over time.

---

## What This Is

Not a task manager. Not a habit tracker.

A **mobile-first behavior system** with streaks, XP, levels, AI suggestions, offline support, and a dark/light/system theme engine.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native (Expo SDK 54) + TypeScript |
| State | Zustand + TanStack React Query |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| Backend | FastAPI + Python 3.9 |
| Database | MySQL 8.0 (via Docker) |
| Cache | Redis 7 (via Docker) |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Offline DB | Expo SQLite v16 |

---

## Prerequisites

### System Requirements

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ LTS | https://nodejs.org |
| Python | 3.9+ | https://python.org |
| Docker Desktop | Latest | https://docker.com |
| Git | Latest | https://git-scm.com |
| Expo Go (phone) | Latest | App Store / Play Store |

### Optional
- Xcode (macOS) — for iOS Simulator
- Android Studio — for Android Emulator

---

## Project Structure

```
consistency-app/
├── backend/          # FastAPI backend
├── mobile/           # React Native (Expo) app
├── specs.md          # Full product specification
└── README.md
```

---

## Backend Setup

### 1. Start Infrastructure (MySQL + Redis)

```bash
cd backend
docker compose up -d
```

This starts:
- MySQL 8.0 on port `3306`
- Redis 7 on port `6379`

### 2. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

> If you get a bcrypt error, run: `pip install bcrypt==4.0.1`

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consistency_db
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
REDIS_URL=redis://localhost:6379/0
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 6. Seed Test Users (optional)

```bash
python seed_users.py
```

| Email | Password |
|---|---|
| alice@test.com | password123 |
| bob@test.com | password123 |
| charlie@test.com | password123 |

---

## Mobile Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=http://<YOUR_MAC_IP>:8000/api/v1
```

> Find your Mac's IP: `ipconfig getifaddr en0`
> Use your LAN IP (e.g. `192.168.1.19`), NOT `localhost` — physical devices can't reach localhost.

### 3. Start the App

```bash
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_MAC_IP> npx expo start --clear --port 8082 --lan
```

### 4. Open on Device

- Install **Expo Go** from App Store / Play Store
- Make sure phone and Mac are on the **same WiFi**
- Open Expo Go → Enter URL manually: `exp://<YOUR_MAC_IP>:8082`

---

## Features

### Phase 1 (Current — MVP)
- [x] JWT Authentication (register + login)
- [x] Task CRUD with difficulty levels (1–5)
- [x] Task completion with streak + XP tracking
- [x] Dashboard aggregated endpoint
- [x] AI rule engine (difficulty adjustment, XP calc, suggestions)
- [x] SQLite offline DB + pending sync queue
- [x] Dark / Light / System theme
- [x] Bottom tab navigation
- [x] Home, Stats, Create Task, Profile screens
- [x] Settings (notifications, theme, account)

### Phase 2 (Planned)
- [ ] Push notifications (FCM)
- [ ] Haptic feedback + micro-animations
- [ ] Background sync
- [ ] Redis caching
- [ ] AsyncStorage token persistence

### Phase 3 (Planned)
- [ ] ML-based difficulty adjustment
- [ ] Smart notification timing
- [ ] Weekly AI insight reports

---

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/tasks/
POST   /api/v1/tasks/
POST   /api/v1/tasks/{id}/complete
GET    /api/v1/stats/dashboard
GET    /health
```

---

## Common Issues

| Issue | Fix |
|---|---|
| Port 8000 in use | `lsof -ti:8000 \| xargs kill -9` |
| bcrypt error | `pip install bcrypt==4.0.1` |
| Phone can't connect | Use Mac's LAN IP, not localhost |
| Metro bundle error | `npx expo start --clear` |
| DB connection error | Make sure Docker is running: `docker compose up -d` |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT
