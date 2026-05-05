#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Consistency App - Fix & Start${NC}\n"

# Get Mac IP
MAC_IP=$(ipconfig getifaddr en0)
if [ -z "$MAC_IP" ]; then
    echo -e "${RED}❌ Could not get Mac IP address${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Mac IP: $MAC_IP${NC}"

# Update mobile .env
echo -e "\n${YELLOW}Updating mobile/.env...${NC}"
cat > mobile/.env << EOF
EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1
EOF
echo -e "${GREEN}✓ Updated mobile/.env${NC}"

# Kill existing processes
echo -e "\n${YELLOW}Killing existing processes...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
echo -e "${GREEN}✓ Cleaned up ports${NC}"

# Start Docker
echo -e "\n${YELLOW}Starting Docker services...${NC}"
cd backend
docker compose up -d
sleep 3
echo -e "${GREEN}✓ Docker running${NC}"

# Start Backend
echo -e "\n${YELLOW}Starting Backend...${NC}"
source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > /dev/null 2>&1 &
sleep 5
echo -e "${GREEN}✓ Backend running on http://$MAC_IP:8000${NC}"

# Start Mobile
echo -e "\n${YELLOW}Starting Mobile App...${NC}"
cd ../mobile
npm install --silent
REACT_NATIVE_PACKAGER_HOSTNAME=$MAC_IP npx expo start --clear --port 8082 --lan > /dev/null 2>&1 &
sleep 5

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "\n${YELLOW}📱 Open Expo Go and scan QR code or enter:${NC}"
echo -e "${GREEN}   exp://$MAC_IP:8082${NC}"
echo -e "\n${YELLOW}🌐 API Docs: ${GREEN}http://$MAC_IP:8000/docs${NC}"
echo -e "${YELLOW}❤️  Health: ${GREEN}http://$MAC_IP:8000/health${NC}\n"
