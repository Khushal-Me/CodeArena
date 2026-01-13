# Security Documentation

## Overview

CodeArena implements defense-in-depth security to safely execute untrusted user code. This document details the security measures implemented across all layers of the system.

## Threat Model

### Threats Addressed

| Threat | Risk Level | Mitigation |
|--------|-----------|------------|
| Code execution escape | Critical | Container isolation, seccomp profiles |
| Resource exhaustion (DoS) | High | Memory/CPU/time limits, rate limiting |
| Network-based attacks | High | Network disabled in containers |
| Filesystem tampering | Medium | Read-only filesystem, tmpfs |
| Information disclosure | Medium | Isolated containers, no shared state |
| Fork bombs | Medium | PID limits, process restrictions |

## Container Isolation

### Docker Security Configuration

Every code execution runs in an isolated Docker container with the following security settings:

```python
container_config = {
    # Network isolation - no network access
    "network_mode": "none",
    
    # Resource limits
    "mem_limit": "256m",
    "memswap_limit": "256m",
    "cpu_period": 100000,
    "cpu_quota": 100000,  # 1 CPU
    "pids_limit": 50,
    
    # Security options
    "read_only": True,
    "security_opt": ["no-new-privileges:true"],
    "cap_drop": ["ALL"],
    
    # User isolation
    "user": "1000:1000",  # Non-root user
}
```

### Seccomp Profiles

Custom seccomp profiles restrict system calls to only those required for code execution:

**Allowed syscalls:**
- Basic I/O: read, write, open, close
- Memory: mmap, munmap, brk
- Process: exit, exit_group
- Time: clock_gettime, gettimeofday

**Blocked syscalls:**
- Network: socket, connect, bind, listen
- Process creation: fork, vfork, clone (limited)
- System modification: mount, umount, reboot
- Privilege escalation: setuid, setgid, capset

## Resource Limits

| Resource | Limit | Purpose |
|----------|-------|---------|
| Memory | 256 MB | Prevent memory exhaustion |
| CPU | 1 core | Prevent CPU monopolization |
| Execution time | 10 seconds | Prevent infinite loops |
| Processes | 50 PIDs | Prevent fork bombs |
| Disk | 10 MB tmpfs | Prevent disk filling |
| File descriptors | 256 | Prevent fd exhaustion |

## Network Security

### Container Network Isolation

All execution containers run with `--network none`:

```bash
docker run --network none ...
```

This completely disables:
- Outbound connections
- DNS resolution
- Any network-based attacks

### API Rate Limiting

```typescript
// Sliding window rate limiter
const rateLimit = {
    windowMs: 60000,     // 1 minute window
    maxRequests: 5,      // 5 submissions per window
    keyGenerator: (req) => req.sessionId,
};
```

## Input Validation

### Code Submission Validation

```typescript
const submissionSchema = z.object({
    problemId: z.string().uuid(),
    language: z.enum(['python', 'javascript', 'java', 'cpp']),
    code: z.string()
        .min(1)
        .max(50000),  // 50KB max
});
```

### Output Sanitization

- Execution output is truncated to prevent log injection
- Special characters are escaped in responses
- Error messages don't expose internal paths

## Database Security

### SQL Injection Prevention

All queries use parameterized statements:

```typescript
// Safe - parameterized query
await query(
    'SELECT * FROM submissions WHERE id = $1',
    [submissionId]
);

// Never used - string concatenation
// `SELECT * FROM submissions WHERE id = '${submissionId}'`
```

### Connection Security

- Database credentials stored in environment variables
- Connections use SSL in production
- Minimal database user permissions

## Infrastructure Security

### Docker Socket Protection

The worker needs Docker socket access to spawn containers. Protection measures:

1. Workers run as non-root where possible
2. Docker socket mounted read-only when possible
3. Container images are pre-built and trusted

### Secret Management

```bash
# Secrets stored in environment variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Never committed to git
# .env files in .gitignore
```

## Monitoring & Incident Response

### Security Logging

All security-relevant events are logged:

```python
logger.warning("Execution timeout", 
    submission_id=id,
    language=lang,
    duration_ms=duration
)
```

### Alerts

Configure alerts for:
- Unusual submission patterns
- Container escape attempts (if seccomp violations logged)
- Rate limit violations
- Resource exhaustion events

## Security Checklist

- [x] Container isolation with Docker
- [x] Network disabled for execution containers
- [x] Resource limits (memory, CPU, time, PIDs)
- [x] Seccomp profiles for syscall filtering
- [x] Non-root container execution
- [x] Read-only filesystem with tmpfs
- [x] Rate limiting on API endpoints
- [x] Input validation and sanitization
- [x] Parameterized database queries
- [x] Secrets in environment variables
- [x] Security logging and monitoring

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public issue
2. Email security concerns to the maintainer
3. Include detailed reproduction steps
4. Allow reasonable time for a fix before disclosure

## References

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Seccomp Security Profiles](https://docs.docker.com/engine/security/seccomp/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
