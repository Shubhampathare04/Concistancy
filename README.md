# Consistency App

> An AI-powered behavior system that lives on your phone — tracks consistency, rewards discipline, and adapts to you over time.

---

## 📚 Documentation

| Document | Description |
|---|---|
| [SETUP.md](SETUP.md) | Complete installation and configuration guide |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development workflow and best practices |
| [TESTING.md](TESTING.md) | Testing procedures and guidelines |
| [specs.md](specs.md) | Full product specification |

---

## What This Is

Not a task manager. Not a habit tracker.

A **mobile-first behavior system** with streaks, XP, levels, AI suggestions, offline support, and a dark/light/system theme engine.

---

## ✨ Features

### Current (MVP - Production Ready)
- ✅ JWT Authentication (register + login)
- ✅ Task CRUD with difficulty levels (1–5)
- ✅ Task completion with streak + XP tracking
- ✅ Dashboard aggregated endpoint
- ✅ AI rule engine (difficulty adjustment, XP calc, suggestions)
- ✅ SQLite offline DB + pending sync queue
- ✅ Dark / Light / System theme
- ✅ Bottom tab navigation with haptic feedback
- ✅ Swipeable tabs with gestures
- ✅ Premium UI/UX (Duolingo/Headspace inspired)
- ✅ Home, Stats, Insights, Community, Profile screens
- ✅ Settings (notifications, theme, account)
- ✅ World-class design system

### Planned (Phase 2)
- [ ] Push notifications (FCM)
- [ ] Background sync
- [ ] Redis caching
- [ ] Social features (groups, challenges)
- [ ] Weekly AI insight reports

### Future (Phase 3)
- [ ] ML-based difficulty adjustment
- [ ] Smart notification timing
- [ ] AR companion character
- [ ] Apple Watch app

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker Desktop
- Expo Go (on phone)

### Backend
```bash
cd backend
docker compose up -d
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python init_mongodb.py
uvicorn app.main:app --reload --host 0.0.0.0
```

### Mobile
```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with your Mac's IP
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_IP> npx expo start --lan
```

### Open App
1. Install Expo Go on your phone
2. Scan QR code from terminal
3. Done! 🎉

**For detailed setup instructions, see [SETUP.md](SETUP.md)**

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54) + TypeScript |
| State | Zustand + TanStack React Query |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| Backend | FastAPI + Python 3.9 |
| Database | MySQL 8.0 + MongoDB Atlas |
| Cache | Redis 7 |
| ORM | SQLAlchemy 2.0 |
| MongoDB Driver | Motor (async) + PyMongo |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Offline DB | Expo SQLite v16 |

---

## 📁 Project Structure

```
consistency-app/
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   ├── tests/           # Backend tests
│   └── docker-compose.yml
├── mobile/              # React Native (Expo) app
│   ├── src/            # Source code
│   │   ├── components/ # Reusable components
│   │   ├── screens/    # Screen components
│   │   ├── navigation/ # Navigation setup
│   │   ├── services/   # API services
│   │   └── store/      # State management
│   └── assets/         # Images, fonts
├── docs/               # Documentation
│   ├── api/           # API documentation
│   ├── architecture/  # Architecture docs
│   └── guides/        # User guides
├── SETUP.md           # Setup guide
├── DEVELOPMENT.md     # Development guide
├── TESTING.md         # Testing guide
├── specs.md           # Product specification
└── README.md          # This file
```

---

## 🎨 Design System

### Premium UI Features
- ✅ Swipeable tabs with gestures (Instagram/Snapchat style)
- ✅ Haptic feedback on all interactions
- ✅ Smooth spring animations (60fps)
- ✅ Gradient backgrounds and glow effects
- ✅ Icon-based UI (no text emojis)
- ✅ Proper safe area handling (notch/Dynamic Island)
- ✅ Pull-to-refresh on all list screens
- ✅ Empty states with beautiful illustrations
- ✅ Loading states with skeleton loaders
- ✅ Dark/Light/System theme support

### Design Principles
- **8pt Grid System** - Consistent spacing
- **Typography Scale** - SF Pro inspired (11-48pt)
- **Color System** - Semantic colors with opacity variants
- **Shadow Hierarchy** - 4-level depth system
- **WCAG AA Compliant** - Accessible contrast ratios

**Inspired by**: Duolingo, Headspace, Calm, Strava, Nike Training Club, Apple Fitness+

---

## 🔌 API Endpoints

```
POST   /api/v1/auth/register       # Register new user
POST   /api/v1/auth/login          # Login user
GET    /api/v1/tasks/              # List tasks
POST   /api/v1/tasks/              # Create task
PUT    /api/v1/tasks/{id}          # Update task
DELETE /api/v1/tasks/{id}          # Delete task
POST   /api/v1/tasks/{id}/complete # Complete task
GET    /api/v1/stats/dashboard     # Dashboard stats
GET    /health                     # Health check
GET    /health/detailed            # Detailed health (MySQL, Redis, MongoDB)
GET    /docs                       # Swagger API docs
```

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app --cov-report=html
```

### Mobile
```bash
cd mobile
npm test
npm test -- --coverage
```

**For detailed testing instructions, see [TESTING.md](TESTING.md)**

---

## 🛠️ Development

### Daily Workflow
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
docker compose up -d
uvicorn app.main:app --reload --host 0.0.0.0

# Terminal 2: Mobile
cd mobile
REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_IP> npx expo start --lan
```

### Commit Convention
```bash
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): improve styling
refactor(scope): refactor code
test(scope): add tests
chore(scope): maintenance
```

**For detailed development guide, see [DEVELOPMENT.md](DEVELOPMENT.md)**

---

## 🐛 Common Issues

| Issue | Fix |
|---|---|
| Port 8000 in use | `lsof -ti:8000 \| xargs kill -9` |
| bcrypt error | `pip install bcrypt==4.0.1` |
| Phone can't connect | Use Mac's LAN IP, not localhost |
| Metro bundle error | `npx expo start --clear` |
| DB connection error | `docker compose up -d` |
| Safe area overlap | Use `edges` prop on ScreenWrapper |

**For more troubleshooting, see [SETUP.md](SETUP.md#troubleshooting)**

---

## 📱 Tested On

- ✅ iPhone 14 Pro (notch)
- ✅ iPhone 15 Pro (Dynamic Island)
- ✅ iPhone SE (no notch)
- ✅ Android (various sizes)
- ✅ iPad (tablet layout)

---

## 🎯 Roadmap

### Phase 1: MVP ✅ (Complete)
- Core task tracking
- Streak system
- XP and levels
- Offline support
- Premium UI/UX

### Phase 2: Social (Q1 2025)
- Groups and challenges
- Leaderboards
- Events
- Push notifications

### Phase 3: Intelligence (Q2 2025)
- ML-based suggestions
- Smart notifications
- Weekly AI reports
- Personalized insights

### Phase 4: Premium (Q3 2025)
- Subscription tiers
- Custom themes
- AR companion
- Apple Watch app

---

## 💰 Monetization Strategy

### Free Tier
- Basic task tracking
- Streak system
- Offline support
- Dark/light theme

### Pro Tier ($4.99/month or $39.99/year)
- AI suggestions
- Streak freeze
- Events & Challenges
- Weekly reports
- Priority support

### Elite Tier ($9.99/month or $79.99/year)
- Everything in Pro
- Professional consulting
- Unlimited streak freezes
- Custom themes
- Early access to features

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

**See [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines**

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

### Design Inspiration
- **Duolingo** - Gamification and streak system
- **Headspace** - Calm UI and smooth animations
- **Calm** - Minimalist design and soothing colors
- **Strava** - Activity tracking and social features
- **Nike Training Club** - Workout UI and progress tracking
- **Apple Fitness+** - Premium feel and smooth transitions

### Technologies
- FastAPI - Modern Python web framework
- React Native - Cross-platform mobile development
- Expo - React Native toolchain
- Zustand - State management
- React Query - Data fetching
- SQLAlchemy - Python ORM
- MongoDB - NoSQL database
- Redis - Caching layer

---

## 📞 Support

- **Documentation**: See docs/ folder
- **Issues**: GitHub Issues
- **Email**: support@consistencyapp.com
- **Discord**: [Join our community](https://discord.gg/consistency)

---

## 🎉 Status

**Current Version**: 2.0 (Premium Edition)  
**Status**: Production Ready ✅  
**Quality**: World-Class 🌟  
**Subscription Ready**: Yes 💰

---

**Built with ❤️ for Champions**  
**Last Updated**: January 2025
