# CodeArena

<div align="center">

**A Production-Grade Distributed Code Execution Platform**


## Overview

CodeArena is a **distributed code execution platform** that safely runs user-submitted code in isolated Docker containers, validates solutions against test cases, and provides real-time feedback via WebSockets.

This project demonstrates expertise in:
- **Distributed Systems** - Queue-based job processing with horizontal scaling
- **Security Engineering** - Sandboxed execution with defense-in-depth protections
- **Full-Stack Development** - React frontend, Node.js APIs, Python workers
- **DevOps Practices** - Docker orchestration, CI/CD pipelines, health monitoring

### Key Achievements

| Metric | Target | Result |
|--------|--------|--------|
| P99 Execution Latency | < 3s | 2.8s |
| Concurrent Executions | 50+ | Achieved |
| Sandbox Security | 0 escapes | Verified |
| System Uptime | 99% | Achieved |

---

## Architecture

```
                                   ┌─────────────────┐
                                   │     Browser     │
                                   │   (React SPA)   │
                                   └────────┬────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │ HTTP/REST       │                 │ WebSocket
                          ▼                 │                 ▼
                   ┌──────────────┐         │        ┌──────────────────┐
                   │  API Gateway │         │        │  WebSocket Server│
                   │  (Express)   │         │        │   (Socket.io)    │
                   └──────┬───────┘         │        └────────┬─────────┘
                          │                 │                 │
         ┌────────────────┼─────────────────┼─────────────────┤
         │                │                 │                 │
         ▼                ▼                 │                 ▼
  ┌────────────┐   ┌────────────┐           │          ┌────────────┐
  │ PostgreSQL │   │   Redis    │◄──────────┴─────────►│   Redis    │
  │  (Data)    │   │  (Queue)   │     Pub/Sub          │  (Pub/Sub) │
  └────────────┘   └─────┬──────┘                      └────────────┘
                         │
                         │ Job Queue (BullMQ)
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Worker 1 │    │ Worker 2 │    │ Worker N │
   │ (Python) │    │ (Python) │    │ (Python) │
   └────┬─────┘    └────┬─────┘    └────┬─────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
              ┌───────────────────┐
              │  Docker Containers │
              │  (Isolated Exec)   │
              └───────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Monaco Editor | Interactive code editor and problem viewer |
| **API Gateway** | Node.js 20, Express, TypeScript | RESTful API, validation, routing |
| **WebSocket** | Socket.io, Redis Pub/Sub | Real-time execution status updates |
| **Job Queue** | BullMQ, Redis | Distributed job scheduling and processing |
| **Workers** | Python 3.11, Docker SDK | Secure code execution in containers |
| **Database** | PostgreSQL 15 | Problem storage, submission history |
| **Infrastructure** | Docker, Docker Compose | Container orchestration |

---

## Features

### Core Functionality
- **Multi-Language Support** - Python, JavaScript, Java, C++
- **Real-Time Updates** - Live status via WebSocket (Queued -> Running -> Complete)
- **Test Case Validation** - Automated verification with detailed results
- **20+ Practice Problems** - Curated across Easy, Medium, Hard difficulties

### Security (Defense-in-Depth)
- **Container Isolation** - Each execution in a fresh Docker container
- **Network Disabled** - `--network none` prevents all network access
- **Resource Limits** - 256MB RAM, 10s timeout, 50 PID limit
- **Seccomp Profiles** - Custom syscall filtering
- **Read-Only Filesystem** - Immutable container with tmpfs for output

### Scalability
- **Horizontal Scaling** - Stateless workers scale linearly
- **Queue-Based Processing** - BullMQ handles job distribution
- **Connection Pooling** - Efficient database and Redis connections
- **Health Monitoring** - Built-in health checks for all services

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) v20.10+
- [Node.js](https://nodejs.org/) v20+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Khushal-Me/CodeArena.git
cd CodeArena

# Start all services
./start.sh
```

The start script will:
1. Build and start Docker containers (PostgreSQL, Redis, API, Workers)
2. Initialize the database with schema and seed data
3. Start the frontend development server

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| WebSocket | ws://localhost:3001 |
| Health Check | http://localhost:3000/health |

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/problems` | List all problems |
| `GET` | `/api/problems/:slug` | Get problem details |
| `POST` | `/api/submissions` | Submit code for execution |
| `GET` | `/api/submissions/:id` | Get submission status |
| `GET` | `/api/history` | Get submission history |
| `GET` | `/health` | Health check |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe_submission` | Client -> Server | `{ submissionId }` |
| `submission_status` | Server -> Client | `{ status: "Running" }` |
| `submission_completed` | Server -> Client | `{ status, testResults, executionTimeMs }` |

See [API Documentation](docs/API.md) for complete details.

---

## Project Structure

```
CodeArena/
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API and WebSocket clients
│   │   └── types/              # TypeScript definitions
│   └── package.json
│
├── backend/
│   ├── api-gateway/            # Express REST API
│   │   ├── src/
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Validation, error handling
│   │   │   └── types/          # TypeScript definitions
│   │   └── package.json
│   │
│   ├── websocket-service/      # Socket.io server
│   │   └── src/
│   │
│   └── execution-worker/       # Python worker
│       └── src/
│           ├── worker.py       # Job consumer
│           ├── executor.py     # Code execution logic
│           └── docker_manager.py # Container management
│
├── scripts/                    # Setup and utility scripts
├── docs/                       # Documentation
├── docker-compose.yml          # Service orchestration
└── start.sh                    # Quick start script
```

---

## Performance

Load test results with 50 concurrent users:

| Metric | Value |
|--------|-------|
| P50 Latency | 1.2s |
| P95 Latency | 2.4s |
| P99 Latency | 2.8s |
| Throughput | 45 submissions/min |
| Error Rate | < 1% |

---

## Security

CodeArena implements comprehensive security measures:

- **Sandboxed Execution** - Docker containers with no network, limited resources
- **Syscall Filtering** - Seccomp profiles block dangerous operations
- **Input Validation** - Zod schemas validate all API inputs
- **Rate Limiting** - 5 submissions/minute per session
- **SQL Injection Prevention** - Parameterized queries throughout

See [Security Documentation](docs/SECURITY.md) for complete details.

---

## Deployment

### Development

```bash
./start.sh
```

### Production (Docker Compose)

```bash
docker compose -f docker-compose.yml up -d --scale worker=4
```

### Cloud Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for AWS, GCP, and Kubernetes configurations.

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for details on the development process and coding standards.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Khushal Mehta**

- GitHub: [@Khushal-Me](https://github.com/Khushal-Me)

---

<div align="center">

*Built to demonstrate distributed systems architecture, security engineering, and full-stack development expertise.*

</div>
