#!/bin/bash

set -e

echo "========================================="
echo "Consistency App - Complete Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get Mac IP
MAC_IP=$(ipconfig getifaddr en0)
if [ -z "$MAC_IP" ]; then
    echo -e "${RED}Error: Could not get Mac IP address${NC}"
    exit 1
fi

echo -e "${GREEN}Mac IP: $MAC_IP${NC}"
echo ""

# Step 1: Docker
echo -e "${YELLOW}Step 1: Starting Docker containers...${NC}"
cd backend
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker containers started${NC}"
else
    echo -e "${RED}Failed to start Docker${NC}"
    exit 1
fi
echo ""

# Step 2: Python environment
echo -e "${YELLOW}Step 2: Setting up Python environment...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo -e "${GREEN}Python environment ready${NC}"
echo ""

# Step 3: Database migrations
echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
alembic upgrade head
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database migrations complete${NC}"
else
    echo -e "${YELLOW}Warning: Migrations failed (may be first run)${NC}"
fi
echo ""

# Step 4: MongoDB initialization
echo -e "${YELLOW}Step 4: Initializing MongoDB...${NC}"
python init_mongodb_complete.py
if [ $? -eq 0 ]; then
    echo -e "${GREEN}MongoDB initialized${NC}"
else
    echo -e "${YELLOW}Warning: MongoDB initialization failed${NC}"
fi
echo ""

# Step 5: Update mobile .env
echo -e "${YELLOW}Step 5: Updating mobile configuration...${NC}"
cd ../mobile
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://$MAC_IP:8000/api/v1
EOF
echo -e "${GREEN}Mobile .env updated${NC}"
echo ""

# Step 6: Mobile dependencies
echo -e "${YELLOW}Step 6: Installing mobile dependencies...${NC}"
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Mobile dependencies installed${NC}"
else
    echo -e "${RED}Failed to install mobile dependencies${NC}"
    exit 1
fi
echo ""

echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "To start the application:"
echo ""
echo -e "${YELLOW}Terminal 1 (Backend):${NC}"
echo "cd backend"
echo "source venv/bin/activate"
echo "uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
echo ""
echo -e "${YELLOW}Terminal 2 (Mobile):${NC}"
echo "cd mobile"
echo "REACT_NATIVE_PACKAGER_HOSTNAME=$MAC_IP npx expo start --clear --port 8082 --lan"
echo ""
echo -e "${YELLOW}On your phone:${NC}"
echo "Open Expo Go and enter: exp://$MAC_IP:8082"
echo ""
echo -e "${GREEN}API Documentation: http://$MAC_IP:8000/docs${NC}"
echo -e "${GREEN}Health Check: http://$MAC_IP:8000/health${NC}"
echo ""
