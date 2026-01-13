#!/bin/bash

# CodeArena - Setup Script
# This script initializes the development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    local missing=()
    
    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing+=("docker-compose")
    fi
    
    if ! command -v node &> /dev/null; then
        missing+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing prerequisites: ${missing[*]}"
        echo ""
        echo "Please install the following:"
        for dep in "${missing[@]}"; do
            case $dep in
                docker|docker-compose)
                    echo "  - Docker Desktop: https://www.docker.com/products/docker-desktop"
                    ;;
                node|npm)
                    echo "  - Node.js (v20+): https://nodejs.org/"
                    ;;
            esac
        done
        exit 1
    fi
    
    log_success "All prerequisites found"
}

# Setup environment file
setup_env() {
    log_step "Setting up environment..."
    
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            log_success "Created .env from .env.example"
        else
            log_warning ".env.example not found, skipping .env creation"
        fi
    else
        log_info ".env already exists"
    fi
}

# Install dependencies
install_deps() {
    log_step "Installing dependencies..."
    
    # API Gateway
    if [ -d "$PROJECT_ROOT/backend/api-gateway" ]; then
        log_info "Installing API Gateway dependencies..."
        cd "$PROJECT_ROOT/backend/api-gateway"
        npm install --silent
        log_success "API Gateway dependencies installed"
    fi
    
    # WebSocket Service
    if [ -d "$PROJECT_ROOT/backend/websocket-service" ]; then
        log_info "Installing WebSocket Service dependencies..."
        cd "$PROJECT_ROOT/backend/websocket-service"
        npm install --silent
        log_success "WebSocket Service dependencies installed"
    fi
    
    # Frontend
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        log_info "Installing Frontend dependencies..."
        cd "$PROJECT_ROOT/frontend"
        npm install --silent
        log_success "Frontend dependencies installed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Build execution containers
build_containers() {
    log_step "Building execution containers..."
    
    if [ -f "$PROJECT_ROOT/scripts/build-containers.sh" ]; then
        chmod +x "$PROJECT_ROOT/scripts/build-containers.sh"
        "$PROJECT_ROOT/scripts/build-containers.sh" build
    else
        log_warning "build-containers.sh not found, skipping container builds"
    fi
}

# Start services
start_services() {
    log_step "Starting services with Docker Compose..."
    
    cd "$PROJECT_ROOT"
    
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    
    log_success "Services started"
}

# Initialize database
init_database() {
    log_step "Initializing database..."
    
    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker exec codearena-postgres pg_isready -U postgres > /dev/null 2>&1; then
            break
        fi
        retries=$((retries - 1))
        sleep 1
    done
    
    if [ $retries -eq 0 ]; then
        log_error "PostgreSQL failed to start"
        return 1
    fi
    
    log_success "PostgreSQL is ready"
    
    # Run schema
    if [ -f "$PROJECT_ROOT/scripts/schema.sql" ]; then
        log_info "Running schema..."
        docker exec -i codearena-postgres psql -U postgres -d codearena < "$PROJECT_ROOT/scripts/schema.sql" > /dev/null 2>&1
        log_success "Schema applied"
    fi
    
    # Run seed
    if [ -f "$PROJECT_ROOT/scripts/seed.sql" ]; then
        log_info "Seeding database..."
        docker exec -i codearena-postgres psql -U postgres -d codearena < "$PROJECT_ROOT/scripts/seed.sql" > /dev/null 2>&1
        log_success "Database seeded"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}CodeArena Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Services running:"
    echo "  - API Gateway:      http://localhost:3000"
    echo "  - WebSocket:        http://localhost:3001"
    echo "  - Frontend:         http://localhost:5173 (run 'npm run dev' in frontend/)"
    echo "  - PostgreSQL:       localhost:5432"
    echo "  - Redis:            localhost:6379"
    echo ""
    echo "Quick commands:"
    echo "  - Start services:   docker compose up -d"
    echo "  - Stop services:    docker compose down"
    echo "  - View logs:        docker compose logs -f"
    echo "  - Run frontend:     cd frontend && npm run dev"
    echo ""
    echo "Happy coding! 🚀"
}

# Main
main() {
    echo ""
    echo "=========================================="
    echo "  CodeArena Development Setup"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    setup_env
    install_deps
    build_containers
    start_services
    init_database
    print_summary
}

# Run with option to skip certain steps
case "${1:-}" in
    --deps-only)
        check_prerequisites
        install_deps
        ;;
    --containers-only)
        check_prerequisites
        build_containers
        ;;
    --db-only)
        init_database
        ;;
    *)
        main
        ;;
esac
