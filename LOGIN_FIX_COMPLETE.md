# ✅ LOGIN ERROR FIXED

## The Problem
The login was failing because password validation (requiring 12+ characters, uppercase, lowercase, digit, special character) was being applied to BOTH registration AND login.

Test users have simple passwords like `password123` which don't meet the strict validation rules.

## The Fix
Created a separate `UserLogin` schema without password validation for the login endpoint. Password validation now only applies during registration.

## Changes Made
1. Added `UserLogin` schema in `schemas.py` (no password validation)
2. Updated `/auth/login` endpoint to use `UserLogin` instead of `UserCreate`
3. Registration still uses `UserCreate` with strict password validation

## ✅ Now You Can Login

### Restart Backend
```bash
cd /Users/dineshgaikwad/Desktop/consistency-app/backend

# Stop current backend (Ctrl+C)

# Start with network access
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
```

### Test Login
```bash
curl -X POST http://192.168.1.5:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'
```

Should return JSON with `access_token`.

### Login on Mobile App
1. Make sure backend is running with `--host 0.0.0.0`
2. Open mobile app in Expo Go
3. Login with:
   - Email: `alice@test.com`
   - Password: `password123`

Should work now! ✅

## Test Users
| Email | Password |
|-------|----------|
| alice@test.com | password123 |
| bob@test.com | password123 |
| charlie@test.com | password123 |

## Admin User
| Email | Password |
|-------|----------|
| admin@consistency.com | Ey9ij5cDoTbEQ^pR |

## Notes
- **Registration** still requires strong passwords (12+ chars, uppercase, lowercase, digit, special char)
- **Login** accepts any password (validates against stored hash)
- This is the correct behavior - validation on registration, authentication on login
