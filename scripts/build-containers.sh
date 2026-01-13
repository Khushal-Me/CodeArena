#!/bin/bash

# CodeArena - Build Execution Containers
# This script builds all Docker images for code execution

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONTAINERS_DIR="$PROJECT_ROOT/backend/execution-containers"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Build a single container
build_container() {
    local lang=$1
    local tag="codearena-runner-$lang:latest"
    local dockerfile="$CONTAINERS_DIR/$lang/Dockerfile"
    
    if [ ! -f "$dockerfile" ]; then
        log_warning "Dockerfile not found for $lang, skipping..."
        return 1
    fi
    
    log_info "Building $lang runner..."
    
    if docker build -t "$tag" -f "$dockerfile" "$CONTAINERS_DIR/$lang" > /dev/null 2>&1; then
        log_success "Built $tag"
        return 0
    else
        log_error "Failed to build $tag"
        return 1
    fi
}

# Build all containers
build_all() {
    log_info "Building all execution containers..."
    echo ""
    
    local languages=("python" "javascript" "java" "cpp")
    local success_count=0
    local fail_count=0
    
    for lang in "${languages[@]}"; do
        if build_container "$lang"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
    done
    
    echo ""
    log_info "Build Summary:"
    log_success "  Successful: $success_count"
    if [ $fail_count -gt 0 ]; then
        log_error "  Failed: $fail_count"
    fi
}

# List built images
list_images() {
    log_info "CodeArena execution containers:"
    echo ""
    docker images | grep "codearena-runner" || log_warning "No containers found"
}

# Clean up images
clean_images() {
    log_info "Removing CodeArena execution containers..."
    
    local images=$(docker images -q "codearena-runner-*" 2>/dev/null)
    
    if [ -n "$images" ]; then
        docker rmi $images -f
        log_success "Removed all CodeArena execution containers"
    else
        log_warning "No CodeArena containers to remove"
    fi
}

# Test a container
test_container() {
    local lang=$1
    local tag="codearena-runner-$lang:latest"
    
    log_info "Testing $lang runner..."
    
    case $lang in
        python)
            docker run --rm "$tag" python3 -c "print('Hello from Python!')" 2>/dev/null
            ;;
        javascript)
            docker run --rm "$tag" node -e "console.log('Hello from JavaScript!')" 2>/dev/null
            ;;
        java)
            log_warning "Java test requires compilation, skipping quick test"
            docker run --rm "$tag" java --version 2>/dev/null | head -1
            ;;
        cpp)
            log_warning "C++ test requires compilation, skipping quick test"
            docker run --rm "$tag" g++ --version 2>/dev/null | head -1
            ;;
        *)
            log_error "Unknown language: $lang"
            return 1
            ;;
    esac
    
    log_success "$lang runner is working"
}

# Test all containers
test_all() {
    log_info "Testing all execution containers..."
    echo ""
    
    local languages=("python" "javascript" "java" "cpp")
    
    for lang in "${languages[@]}"; do
        if docker image inspect "codearena-runner-$lang:latest" > /dev/null 2>&1; then
            test_container "$lang"
        else
            log_warning "$lang container not built, skipping test"
        fi
        echo ""
    done
}

# Show usage
usage() {
    echo "CodeArena Container Build Script"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  build [lang]    Build containers (all if no lang specified)"
    echo "  list            List built containers"
    echo "  test [lang]     Test containers (all if no lang specified)"
    echo "  clean           Remove all CodeArena containers"
    echo "  help            Show this help message"
    echo ""
    echo "Languages: python, javascript, java, cpp"
    echo ""
    echo "Examples:"
    echo "  $0 build              # Build all containers"
    echo "  $0 build python       # Build only Python container"
    echo "  $0 test               # Test all containers"
    echo "  $0 clean              # Remove all containers"
}

# Main
main() {
    check_docker
    
    case "${1:-build}" in
        build)
            if [ -n "$2" ]; then
                build_container "$2"
            else
                build_all
            fi
            ;;
        list)
            list_images
            ;;
        test)
            if [ -n "$2" ]; then
                test_container "$2"
            else
                test_all
            fi
            ;;
        clean)
            clean_images
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $1"
            usage
            exit 1
            ;;
    esac
}

main "$@"
