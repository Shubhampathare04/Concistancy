# 🚀 Setup Guide

Complete installation and configuration guide for the Consistency App.

---

## Prerequisites

### Required Software

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ LTS | https://nodejs.org |
| Python | 3.9+ | https://python.org |
| Docker Desktop | Latest | https://docker.com |
| Git | Latest | https://git-scm.com |

### Mobile Development

| Platform | Tool | Download |
|---|---|---|
| iOS | Xcode 14+ | Mac App Store |
| Android | Android Studio | https://developer.android.com |
| Physical Device | Expo Go | App Store / Play Store |

### Verify Installation
```bash
node --version    # v18.0.0+
python3 --version # 3.9.0+
docker --version  # 20.0.0+
git --version     # 2.0.0+
```

---

## Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/consistency-app.git
cd consistency-app
```

### 2. Backend Setup
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

### 3. Mobile Setup
```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with your Mac's IP
npx expo start --lan
```

### 4. Open App
- Install Expo Go on your phone
- Scan QR code from terminal
- Done! 🎉

---

## Detailed Backend Setup

### 1. Infrastructure (Docker)

#### Start Services
```bash
cd backend
docker compose up -d
```

This starts:
- **MySQL 8.0** on port `3306`
- **Redis 7** on port `6379`

#### Verify Services
```bash
# Check containers
docker ps

# Test MySQL
docker exec -it consistency-mysql mysql -u root -ppassword -e "SELECT 1"

# Test Redis
docker exec -it consistency-redis redis-cli PING
```

#### Stop Services
```bash
docker compose down      # Stop containers
docker compose down -v   # Stop and remove volumes
```

### 2. Python Environment

#### Create Virtual Environment
```bash
cd backend
python3 -m venv venv
```

#### Activate Environment
```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Common Issues
```bash
# bcrypt error
pip install bcrypt==4.0.1

# MySQL driver error
pip install pymysql cryptography

# Upgrade pip
pip install --upgrade pip
```

### 3. Environment Configuration

#### Copy Template
```bash
cp .env.example .env
```

#### Edit .env
```bash
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/consistency_db

# MongoDB Atlas (get from https://cloud.mongodb.com)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/consistency_app?retryWrites=true&w=majority

# JWT (generate with: openssl rand -hex 32)
JWT_SECRET=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Redis
REDIS_URL=redis://localhost:6379/0

# Environment
ENVIRONMENT=development
```

#### Generate JWT Secret
```bash
# macOS/Linux
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Database Initialization

#### MySQL (Automatic)
SQLAlchemy creates tables automatically on first run.

#### MongoDB (Manual)
```bash
python init_mongodb.py
```

Creates collections:
- users
- tasks
- habits
- completions
- stats
- streaks
- notifications
- sync_queue

#### Seed Test Data
```bash
python seed_users.py
```

Creates test users:
- alice@test.com / password123
- bob@test.com / password123
- charlie@test.com / password123

### 5. Start Backend Server

#### Development Mode
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Production Mode
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Verify Server
```bash
# Health check
curl http://localhost:8000/health

# Detailed health
curl http://localhost:8000/health/detailed

# API docs
open http://localhost:8000/docs
```

---

## Detailed Mobile Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

#### Common Issues
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Expo CLI
npm install -g expo-cli

# iOS pods (macOS only)
cd ios && pod install && cd ..
```

### 2. Environment Configuration

#### Copy Template
```bash
cp .env.example .env
```

#### Find Your IP Address
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'

# Windows
ipconfig | findstr IPv4
```

#### Edit .env
```bash
# Use your LAN IP, NOT localhost
EXPO_PUBLIC_API_URL=http://192.168.1.19:8000/api/v1
```

**Important**: Physical devices can't reach `localhost`. Use your computer's LAN IP.

### 3. Start Development Server

#### Standard Start
```bash
npx expo start
```

#### LAN Mode (Recommended)
```bash
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.19 npx expo start --lan --port 8082
```

#### Clear Cache
```bash
npx expo start --clear
```

#### Tunnel Mode (Firewall Issues)
```bash
npx expo start --tunnel
```

### 4. Open on Device

#### Physical Device (Recommended)
1. Install **Expo Go** from App Store / Play Store
2. Ensure phone and computer are on **same WiFi**
3. Scan QR code from terminal
4. App loads automatically

#### iOS Simulator (macOS Only)
```bash
# Press 'i' in terminal
# Or
npx expo start --ios
```

#### Android Emulator
```bash
# Press 'a' in terminal
# Or
npx expo start --android
```

### 5. Verify Connection

#### Test API Connection
Open app → Should see login screen

#### Check Logs
```bash
# Terminal shows Metro bundler logs
# Expo Go app shows runtime logs
```

#### Common Issues
```bash
# Can't connect to backend
# - Check backend is running: curl http://localhost:8000/health
# - Check .env has correct IP
# - Check same WiFi network
# - Check firewall settings

# Metro bundler error
npx expo start --clear

# Port in use
npx expo start --port 8083
```

---

## Platform-Specific Setup

### macOS

#### Install Xcode
```bash
# From Mac App Store
# Then install command line tools
xcode-select --install
```

#### Install Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Tools
```bash
brew install node python git
brew install --cask docker
```

### Windows

#### Install WSL2 (Recommended)
```powershell
wsl --install
```

#### Install Tools
- Node.js: https://nodejs.org
- Python: https://python.org
- Docker Desktop: https://docker.com
- Git: https://git-scm.com

#### Configure Docker
Enable WSL2 backend in Docker Desktop settings

### Linux (Ubuntu/Debian)

#### Install Tools
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python
sudo apt-get install python3 python3-pip python3-venv

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Git
sudo apt-get install git
```

---

## MongoDB Atlas Setup

### 1. Create Account
1. Go to https://cloud.mongodb.com
2. Sign up for free account
3. Create new cluster (M0 Free tier)

### 2. Configure Access

#### Network Access
1. Go to Network Access
2. Add IP Address
3. Allow access from anywhere: `0.0.0.0/0`

#### Database Access
1. Go to Database Access
2. Add new user
3. Choose password authentication
4. Save username and password

### 3. Get Connection String
1. Go to Clusters
2. Click "Connect"
3. Choose "Connect your application"
4. Copy connection string
5. Replace `<password>` with your password
6. Add to `.env` as `MONGODB_URI`

---

## IDE Setup

### VS Code (Recommended)

#### Install Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "bradlc.vscode-tailwindcss",
    "expo.vscode-expo-tools"
  ]
}
```

#### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.python"
  }
}
```

### PyCharm

1. Open `backend` folder
2. Configure Python interpreter (venv)
3. Install requirements
4. Run configurations for uvicorn

---

## Troubleshooting

### Backend Issues

#### Port 8000 in use
```bash
lsof -ti:8000 | xargs kill -9
```

#### Database connection error
```bash
# Check Docker
docker ps

# Restart services
docker compose restart

# Check logs
docker compose logs mysql
docker compose logs redis
```

#### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Mobile Issues

#### Can't connect to backend
```bash
# Check backend is running
curl http://localhost:8000/health

# Check .env has correct IP
cat .env

# Restart with LAN mode
npx expo start --lan --clear
```

#### Metro bundler error
```bash
# Clear cache
npx expo start --clear

# Reset Metro
rm -rf node_modules/.cache
npx expo start
```

#### Build errors
```bash
# Clear everything
rm -rf node_modules
npm install
npx expo start --clear
```

---

## Next Steps

1. Read [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow
2. Read [TESTING.md](TESTING.md) for testing guide
3. Check [README.md](README.md) for feature overview
4. Review [specs.md](specs.md) for full specification

---

**Last Updated**: January 2025
