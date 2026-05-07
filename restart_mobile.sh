#!/bin/bash

echo "🔄 Restarting mobile app..."

# Kill Metro
lsof -ti:8082 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null

# Get IP
MAC_IP=$(ipconfig getifaddr en0)
echo "✓ Using IP: $MAC_IP"

# Update .env
echo "EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1" > mobile/.env

# Clear cache and start
cd mobile
rm -rf .expo node_modules/.cache
REACT_NATIVE_PACKAGER_HOSTNAME=$MAC_IP npx expo start --clear --port 8082 --lan
