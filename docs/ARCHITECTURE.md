# CodeArena Architecture

This document provides a detailed technical overview of CodeArena's architecture, design decisions, and implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Deep Dive](#component-deep-dive)
3. [Data Flow](#data-flow)
4. [Security Architecture](#security-architecture)
5. [Scaling Considerations](#scaling-considerations)
6. [Design Decisions](#design-decisions)

---

## System Overview

CodeArena is a distributed system designed to safely execute untrusted user code. The architecture follows microservices principles with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React SPA (Browser)                        │   │
│  │  - Monaco Editor for code input                               │   │
│  │  - Real-time status via WebSocket                             │   │
│  │  - Problem display and navigation                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │ HTTP/WS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Gateway Layer                                │
│  ┌────────────────────────┐    ┌────────────────────────────┐      │
│  │     API Gateway        │    │    WebSocket Server        │      │
│  │  - Request validation  │    │  - Real-time pub/sub       │      │
│  │  - Job enqueueing      │    │  - Session management      │      │
│  │  - Rate limiting       │    │  - Event broadcasting      │      │
│  └───────────┬────────────┘    └──────────────┬─────────────┘      │
└──────────────┼─────────────────────────────────┼────────────────────┘
               │                                 │
               ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌────────────────────────┐    ┌────────────────────────────┐      │
│  │      PostgreSQL        │    │         Redis              │      │
│  │  - Problems            │    │  - Job queue (BullMQ)      │      │
│  │  - Submissions         │    │  - Pub/Sub channels        │      │
│  │  - Test cases          │    │  - Session cache           │      │
│  └────────────────────────┘    └──────────────┬─────────────┘      │
└────────────────────────────────────────────────┼────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Worker Layer                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │    Worker 1    │  │    Worker 2    │  │    Worker N    │        │
│  │  - Job polling │  │  - Job polling │  │  - Job polling │        │
│  │  - Container   │  │  - Container   │  │  - Container   │        │
│  │    execution   │  │    execution   │  │    execution   │        │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘        │
└──────────┼───────────────────┼───────────────────┼──────────────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Execution Layer                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                  Docker Containers                          │    │
│  │  - Isolated execution environment                           │    │
│  │  - No network access                                        │    │
│  │  - Resource limits (CPU, memory, time)                      │    │
│  │  - Seccomp syscall filtering                                │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Deep Dive

### API Gateway (Node.js/Express)

**Responsibilities:**
- RESTful API for problems, submissions, and history
- Request validation using Zod schemas
- Job creation and enqueueing to BullMQ
- Health monitoring and metrics

**Key Design Patterns:**
- Middleware pipeline for validation, logging, error handling
- Dependency injection for testability
- Async/await with proper error boundaries

```typescript
// Request flow through middleware pipeline
Request → Validation → Rate Limiting → Handler → Response
                ↓ (on error)
           Error Handler → Error Response
```

### WebSocket Server (Socket.io)

**Responsibilities:**
- Real-time bidirectional communication
- Subscription management for submissions
- Event broadcasting from Redis Pub/Sub

**Event Flow:**
```
Worker completes job
       ↓
Publish to Redis channel: submission:{id}
       ↓
WebSocket server receives via subscription
       ↓
Broadcast to subscribed clients
```

### Execution Workers (Python)

**Responsibilities:**
- Poll BullMQ queue for pending jobs
- Orchestrate Docker container lifecycle
- Execute code and capture output
- Compare results against test cases
- Update database and publish results

**Job Processing:**
```python
def process_job(job):
    # 1. Parse job data
    submission_id, code, language, test_cases = parse_job(job)
    
    # 2. Update status to "Running"
    publish_status(submission_id, "Running")
    
    # 3. Execute in Docker container
    for test_case in test_cases:
        result = docker_execute(code, language, test_case.input)
        compare_output(result, test_case.expected)
    
    # 4. Aggregate results
    final_status = determine_status(results)
    
    # 5. Store results
    update_database(submission_id, final_status, results)
    
    # 6. Notify completion
    publish_completion(submission_id, final_status, results)
```

### Docker Execution Environment

**Container Configuration:**
```python
container_config = {
    "network_mode": "none",          # No network access
    "mem_limit": "256m",             # Memory limit
    "cpu_period": 100000,            # CPU scheduling
    "cpu_quota": 100000,             # 1 CPU core max
    "pids_limit": 50,                # Process limit
    "read_only": True,               # Immutable filesystem
    "security_opt": ["no-new-privileges:true"],
    "cap_drop": ["ALL"],             # Drop all capabilities
}
```

---

## Data Flow

### Submission Flow

```
1. User writes code in Monaco Editor
                │
                ▼
2. Frontend sends POST /api/submissions
   {problemId, language, code}
                │
                ▼
3. API Gateway validates request (Zod schema)
                │
                ▼
4. Create submission record in PostgreSQL
   Status: "Queued"
                │
                ▼
5. Add job to BullMQ queue with:
   - submissionId
   - code
   - language
   - testCases
                │
                ▼
6. Return submissionId to frontend
                │
                ▼
7. Frontend subscribes to WebSocket
   Event: "subscribe_submission"
                │
                ▼
8. Worker picks up job from queue
                │
                ▼
9. Worker publishes status update
   Status: "Running"
                │
                ▼
10. WebSocket broadcasts to client
                │
                ▼
11. Worker executes code in Docker
                │
                ▼
12. Worker compares output vs expected
                │
                ▼
13. Worker updates database with results
                │
                ▼
14. Worker publishes completion
    Status: "Accepted" or "Wrong Answer"
                │
                ▼
15. WebSocket broadcasts final result
                │
                ▼
16. Frontend displays results to user
```

---

## Security Architecture

### Defense in Depth

```
Layer 1: Input Validation
├── Zod schemas validate all API inputs
├── Code size limits (50KB max)
└── Language whitelist enforcement

Layer 2: Rate Limiting
├── Sliding window algorithm
├── 5 requests per minute per session
└── Redis-backed for distributed enforcement

Layer 3: Container Isolation
├── Separate Docker container per execution
├── Unique container ID prevents cross-talk
└── Container destroyed after execution

Layer 4: Network Isolation
├── --network none disables all networking
├── No DNS resolution
└── No outbound connections possible

Layer 5: Resource Limits
├── Memory: 256MB hard limit
├── CPU: 1 core max
├── Time: 10 second timeout
├── PIDs: 50 process limit
└── Disk: tmpfs with size limit

Layer 6: Syscall Filtering
├── Seccomp profiles restrict syscalls
├── Block: socket, fork, exec (limited)
└── Allow: read, write, mmap, exit

Layer 7: Privilege Reduction
├── Run as non-root user (uid 1000)
├── Drop ALL capabilities
└── no-new-privileges flag
```

---

## Scaling Considerations

### Horizontal Scaling

**Workers:**
```bash
# Scale workers with Docker Compose
docker compose up -d --scale worker=10
```

Workers are stateless and can scale horizontally:
- Each worker polls the same Redis queue
- BullMQ ensures exactly-once job delivery
- No coordination needed between workers

**API Gateway:**
```bash
# Scale API with load balancer
docker compose up -d --scale api-gateway=3
```

API Gateway instances are stateless:
- Session state stored in Redis
- Database connections pooled per instance
- Load balancer distributes requests

### Bottlenecks and Solutions

| Bottleneck | Solution |
|------------|----------|
| Queue throughput | Redis cluster mode |
| Database writes | Connection pooling, batching |
| Docker startup | Pre-warmed container pools |
| Memory per worker | Tune container limits |

---

## Design Decisions

### Why BullMQ over alternatives?

| Feature | BullMQ | RabbitMQ | AWS SQS |
|---------|--------|----------|---------|
| Complexity | Low | Medium | Low |
| Latency | Very Low | Low | Medium |
| Priority queues | Yes | Yes | No |
| Delayed jobs | Yes | Plugin | Yes |
| Dashboard | Bull Board | Management UI | CloudWatch |
| Infrastructure | Redis (existing) | New service | AWS-only |

**Decision:** BullMQ chosen for simplicity, low latency, and Redis reuse.

### Why Python Workers?

| Factor | Python | Node.js | Go |
|--------|--------|---------|-----|
| Docker SDK | Excellent | Good | Good |
| Process management | Good | Challenging | Excellent |
| Team familiarity | High | High | Medium |
| Deployment | Docker | Docker | Native binary |

**Decision:** Python chosen for Docker SDK quality and async capabilities.

### Why PostgreSQL over MongoDB?

| Factor | PostgreSQL | MongoDB |
|--------|------------|---------|
| Data model | Relational (problems, submissions) | Document |
| ACID compliance | Full | Configurable |
| Complex queries | Excellent | Limited |
| Type safety | Strong | Flexible |

**Decision:** PostgreSQL chosen for relational data model and strong consistency.

