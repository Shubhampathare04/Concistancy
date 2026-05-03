#!/bin/bash

echo "🔍 Consistency App - Connection Troubleshooter"
echo "=============================================="
echo ""

# Get Mac IP
MAC_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")
echo "📡 Your Mac IP: $MAC_IP"
echo ""

# Check if backend is running on localhost
echo "1️⃣ Checking if backend is running on localhost..."
LOCALHOST_CHECK=$(curl -s http://localhost:8000/health 2>&1)
if [[ $LOCALHOST_CHECK == *"status"* ]]; then
    echo "   ✅ Backend is running on localhost"
else
    echo "   ❌ Backend is NOT running on localhost"
    echo "   → Start backend with: uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
    exit 1
fi
echo ""

# Check if backend is accessible from network IP
echo "2️⃣ Checking if backend is accessible from network IP..."
NETWORK_CHECK=$(curl -s http://$MAC_IP:8000/health 2>&1)
if [[ $NETWORK_CHECK == *"status"* ]]; then
    echo "   ✅ Backend is accessible from network ($MAC_IP:8000)"
else
    echo "   ❌ Backend is NOT accessible from network"
    echo "   → Backend is running but only on localhost"
    echo "   → STOP backend (Ctrl+C) and restart with:"
    echo "   → uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
    exit 1
fi
echo ""

# Check mobile .env configuration
echo "3️⃣ Checking mobile app configuration..."
if [ -f "../mobile/.env" ]; then
    MOBILE_API_URL=$(grep EXPO_PUBLIC_API_URL ../mobile/.env | cut -d '=' -f2)
    echo "   Mobile API URL: $MOBILE_API_URL"
    EXPECTED_URL="http://$MAC_IP:8000/api/v1"
    if [[ $MOBILE_API_URL == $EXPECTED_URL ]]; then
        echo "   ✅ Mobile .env is configured correctly"
    else
        echo "   ⚠️  Mobile .env might be incorrect"
        echo "   → Expected: $EXPECTED_URL"
        echo "   → Found: $MOBILE_API_URL"
    fi
else
    echo "   ⚠️  mobile/.env not found"
fi
echo ""

# Test login endpoint
echo "4️⃣ Testing login endpoint..."
LOGIN_TEST=$(curl -s -X POST http://$MAC_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}' 2>&1)

if [[ $LOGIN_TEST == *"access_token"* ]]; then
    echo "   ✅ Login endpoint works! Test user can login."
else
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_TEST"
    echo ""
    echo "   → Make sure test users exist. Run: python3 seed_users.py"
fi
echo ""

# Check MySQL
echo "5️⃣ Checking MySQL..."
MYSQL_CHECK=$(docker ps | grep mysql)
if [[ -n $MYSQL_CHECK ]]; then
    echo "   ✅ MySQL container is running"
else
    echo "   ❌ MySQL is not running"
    echo "   → Start with: docker compose up -d"
fi
echo ""

# Summary
echo "=============================================="
echo "📋 SUMMARY"
echo "=============================================="
echo ""

if [[ $NETWORK_CHECK == *"status"* ]] && [[ $LOGIN_TEST == *"access_token"* ]]; then
    echo "✅ Everything looks good!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Make sure mobile/.env has: EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1"
    echo "   2. Start mobile app: cd mobile && npx expo start --clear"
    echo "   3. Open Expo Go on your phone"
    echo "   4. Login with: alice@test.com / password123"
    echo ""
else
    echo "❌ Issues found. Follow the fixes above."
    echo ""
    echo "🔧 Quick fix:"
    echo "   1. Stop backend (Ctrl+C)"
    echo "   2. Start with: uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
    echo "   3. Run this script again"
    echo ""
fi
