#!/bin/bash

echo "🔥 HARD RESET - Fixing localhost issue"

# Kill everything
echo "Killing all processes..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
pkill -f "expo start" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null

# Get IP
MAC_IP=$(ipconfig getifaddr en0)
echo "✓ Mac IP: $MAC_IP"

# Update mobile .env
echo "EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1" > mobile/.env
echo "✓ Updated mobile/.env"

# Clear all caches
echo "Clearing caches..."
rm -rf mobile/.expo
rm -rf mobile/node_modules/.cache
rm -rf mobile/.metro

echo ""
echo "✅ DONE! Now run these 2 commands in SEPARATE terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "cd ~/Desktop/consistency-app/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
echo ""
echo "Terminal 2 (Mobile):"
echo "cd ~/Desktop/consistency-app/mobile && REACT_NATIVE_PACKAGER_HOSTNAME=$MAC_IP npx expo start --clear --port 8082 --lan"
echo ""
echo "Then on phone: Close Expo Go completely and reopen, scan QR"
