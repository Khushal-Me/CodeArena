# CodeArena Deployment Guide

This guide covers deploying CodeArena to various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Compose Production](#docker-compose-production)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Monitoring & Observability](#monitoring--observability)

---

## Local Development

### Quick Start

```bash
# Clone and setup
git clone https://github.com/Khushal-Me/codearena.git
cd codearena
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Start Infrastructure**
   ```bash
   docker compose up -d postgres redis
   ```

3. **Initialize Database**
   ```bash
   # Wait for PostgreSQL to be ready
   docker exec -i codearena-postgres psql -U postgres -d codearena < scripts/schema.sql
   docker exec -i codearena-postgres psql -U postgres -d codearena < scripts/seed.sql
   ```

4. **Build Execution Containers**
   ```bash
   ./scripts/build-containers.sh build
   ```

5. **Start All Services**
   ```bash
   docker compose up -d
   ```

6. **Start Frontend Dev Server**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| WebSocket | http://localhost:3001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## Docker Compose Production

### Prerequisites

- Docker 24+
- Docker Compose v2
- 4GB RAM minimum
- 20GB disk space

### Production Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  websocket-service:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  worker:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 1G

  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  redis:
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Deploy

```bash
# Build and deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Scale workers
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale worker=5
```

### SSL/TLS with Traefik

Add `docker-compose.traefik.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - letsencrypt:/letsencrypt

  api-gateway:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.codearena.example.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

  websocket-service:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ws.rule=Host(`ws.codearena.example.com`)"
      - "traefik.http.routers.ws.entrypoints=websecure"
      - "traefik.http.routers.ws.tls.certresolver=letsencrypt"

volumes:
  letsencrypt:
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.25+)
- kubectl configured
- Helm 3

### Namespace Setup

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: codearena
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: codearena-config
  namespace: codearena
data:
  NODE_ENV: production
  REDIS_HOST: redis
  POSTGRES_HOST: postgres
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: codearena-secrets
  namespace: codearena
type: Opaque
stringData:
  POSTGRES_PASSWORD: your-secure-password
  REDIS_PASSWORD: your-redis-password
```

### API Gateway Deployment

```yaml
# k8s/api-gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: codearena
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: codearena/api-gateway:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: codearena-config
        - secretRef:
            name: codearena-secrets
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: codearena
spec:
  selector:
    app: api-gateway
  ports:
  - port: 3000
    targetPort: 3000
```

### Worker Deployment

```yaml
# k8s/worker.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
  namespace: codearena
spec:
  replicas: 5
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
      - name: worker
        image: codearena/worker:latest
        envFrom:
        - configMapRef:
            name: codearena-config
        - secretRef:
            name: codearena-secrets
        resources:
          limits:
            cpu: "2000m"
            memory: "2Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        volumeMounts:
        - name: docker-sock
          mountPath: /var/run/docker.sock
      volumes:
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
  namespace: codearena
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: worker
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Deploy to Kubernetes

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/websocket.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

---

## Cloud Deployment

### AWS (ECS/Fargate)

1. **Push images to ECR**
   ```bash
   aws ecr create-repository --repository-name codearena/api-gateway
   docker tag codearena-api-gateway:latest $ECR_URL/codearena/api-gateway:latest
   docker push $ECR_URL/codearena/api-gateway:latest
   ```

2. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name codearena
   ```

3. **Use CloudFormation or Terraform for full setup**

### Google Cloud (Cloud Run)

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/codearena-api

# Deploy
gcloud run deploy codearena-api \
  --image gcr.io/PROJECT_ID/codearena-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### DigitalOcean (App Platform)

Create `app.yaml`:
```yaml
name: codearena
services:
  - name: api-gateway
    source:
      repo: your-repo
      branch: main
      deploy_on_push: true
    http_port: 3000
    instance_count: 2
    instance_size_slug: basic-xs
    routes:
      - path: /api
```

---

## Monitoring & Observability

### Prometheus Metrics

Add to API Gateway:
```typescript
import promClient from 'prom-client';

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

### Grafana Dashboard

Import dashboard ID: `1860` for Docker metrics

### Logging (ELK Stack)

```yaml
# docker-compose.elk.yml
services:
  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: kibana:8.8.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: logstash:8.8.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

### Health Checks

```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health

# Check queue depth
redis-cli llen bull:submissions:wait
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup
docker exec codearena-postgres pg_dump -U postgres codearena > backup.sql

# Restore
docker exec -i codearena-postgres psql -U postgres codearena < backup.sql
```

### Scheduled Backups

```bash
# Add to crontab
0 0 * * * docker exec codearena-postgres pg_dump -U postgres codearena | gzip > /backups/codearena-$(date +\%Y\%m\%d).sql.gz
```
