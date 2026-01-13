#!/bin/bash

# CodeArena Startup Script
# Starts both backend (Docker services) and frontend (Vite dev server)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         CodeArena Startup Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    docker-compose down 2>/dev/null || true
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start backend services
echo -e "${YELLOW}Starting backend services (PostgreSQL, Redis, API Gateway, Workers)...${NC}"
docker-compose up -d --build

# Wait for Redis to be ready and flush old data
echo -e "${YELLOW}Clearing old queue data from Redis...${NC}"
sleep 3
docker-compose exec -T redis redis-cli FLUSHALL > /dev/null 2>&1 || true

# Restart API gateway to ensure clean queue state
docker-compose restart api-gateway > /dev/null 2>&1

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 3

# Check if API Gateway is responding
MAX_RETRIES=30
RETRY_COUNT=0
while ! curl -s http://localhost:3000/health > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}Error: API Gateway failed to start after ${MAX_RETRIES} attempts${NC}"
        docker-compose logs api-gateway --tail=50
        exit 1
    fi
    echo -e "  Waiting for API Gateway... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo -e "${GREEN}✓ Backend services are running${NC}"

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Start frontend dev server
echo -e "${YELLOW}Starting frontend dev server...${NC}"
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         CodeArena is running!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Frontend:${NC}    http://localhost:5173"
echo -e "  ${BLUE}API Gateway:${NC} http://localhost:3000"
echo -e "  ${BLUE}WebSocket:${NC}   ws://localhost:3001"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for frontend process
wait $FRONTEND_PID
