#!/bin/bash

# Consistency App - Backend Startup Script
# This script starts the backend with network access for mobile app

echo "🚀 Starting Consistency Backend..."
echo "=================================="
echo ""

# Get Mac IP address
MAC_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

echo "📡 Network Configuration:"
echo "   Mac IP: $MAC_IP"
echo "   Port: 8000"
echo ""

echo "🔗 Access URLs:"
echo "   Local:   http://localhost:8000"
echo "   Network: http://$MAC_IP:8000"
echo "   Docs:    http://localhost:8000/docs"
echo "   Health:  http://localhost:8000/health"
echo ""

echo "📱 Mobile App Configuration:"
echo "   Make sure mobile/.env has:"
echo "   EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1"
echo ""

echo "=================================="
echo "Starting server..."
echo ""

# Start uvicorn with network access
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
