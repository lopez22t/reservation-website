#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking Reservation System Setup...${NC}\n"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js${NC} - $NODE_VERSION"
else
    echo -e "${RED}❌ Node.js${NC} - Not installed"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm${NC} - v$NPM_VERSION"
else
    echo -e "${RED}❌ npm${NC} - Not installed"
    exit 1
fi

# Check MongoDB
if command -v mongod &> /dev/null; then
    MONGO_VERSION=$(mongod --version | head -1)
    echo -e "${GREEN}✅ MongoDB${NC} - Installed"
else
    echo -e "${YELLOW}⚠️  MongoDB${NC} - Not found in PATH (may be running as service)"
fi

# Check .env file
echo
if [ -f "back-end/.env" ]; then
    echo -e "${GREEN}✅ .env file${NC} - Found"
    if grep -q "JWT_SECRET=" back-end/.env; then
        echo -e "${GREEN}   ✓ JWT_SECRET configured${NC}"
    else
        echo -e "${RED}   ✗ JWT_SECRET missing${NC}"
    fi
    if grep -q "MONGODB_URI=" back-end/.env; then
        echo -e "${GREEN}   ✓ MongoDB URI configured${NC}"
    else
        echo -e "${RED}   ✗ MongoDB URI missing${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file${NC} - Not found (run: cp back-end/.env.example back-end/.env)"
fi

# Check node_modules
echo
if [ -d "back-end/node_modules" ]; then
    echo -e "${GREEN}✅ Dependencies${NC} - Installed"
else
    echo -e "${YELLOW}⚠️  Dependencies${NC} - Not installed (run: cd back-end && npm install)"
fi

# Check seed script
echo
if [ -f "back-end/seeds/seedData.js" ]; then
    echo -e "${GREEN}✅ Seed script${NC} - Found"
else
    echo -e "${YELLOW}⚠️  Seed script${NC} - Not found"
fi

echo
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. cd back-end && npm install"
echo "2. Configure .env with your MongoDB URI"
echo "3. Start MongoDB (if local): brew services start mongodb-community"
echo "4. Seed database: node seeds/seedData.js"
echo "5. Start server: npm run dev"
echo "6. Open http://localhost:5000 in browser"
echo
