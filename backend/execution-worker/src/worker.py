"""
CodeArena Execution Worker

This worker process consumes code execution jobs from the Redis queue (BullMQ)
and processes them in isolated Docker containers.

Architecture:
- Connects to Redis to pull jobs from the BullMQ priority queue
- Spawns Docker containers for each execution
- Publishes real-time status updates via Redis Pub/Sub
- Stores results in PostgreSQL

Job Flow:
1. Poll Redis queue for pending jobs (ZPOPMIN on sorted set)
2. Update submission status to "Running"
3. Execute code in Docker container with resource limits
4. Compare output against test cases
5. Update database with results
6. Publish completion event for WebSocket delivery

Scaling:
- Workers are stateless and can scale horizontally
- Each worker handles WORKER_CONCURRENCY jobs concurrently
- Queue ensures exactly-once processing via atomic operations
"""

import os
import json
import time
import signal
import sys
from typing import Optional, Dict, Any, List
from datetime import datetime

import redis
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

from .logger import setup_logging, get_logger
from .executor import CodeExecutor, TestCase, SubmissionStatus
from .docker_manager import ExecutionConfig

# Load environment variables
load_dotenv()

# Setup logging
setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = get_logger("worker")

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/codearena")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
WORKER_CONCURRENCY = int(os.getenv("WORKER_CONCURRENCY", "3"))
EXECUTION_TIMEOUT_MS = int(os.getenv("EXECUTION_TIMEOUT_MS", "10000"))
MAX_MEMORY_MB = int(os.getenv("MAX_MEMORY_MB", "256"))

# Queue configuration (BullMQ format)
QUEUE_NAME = "execution-queue"
QUEUE_PRIORITIZED_KEY = f"bull:{QUEUE_NAME}:prioritized"
QUEUE_ACTIVE_KEY = f"bull:{QUEUE_NAME}:active"
QUEUE_MARKER_KEY = f"bull:{QUEUE_NAME}:marker"

# Global shutdown flag
shutdown_requested = False


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    global shutdown_requested
    logger.info("Shutdown signal received", signal=signum)
    shutdown_requested = True


def get_redis_connection() -> redis.Redis:
    """Create a Redis connection."""
    return redis.from_url(REDIS_URL, decode_responses=True)


def get_db_connection():
    """Create a database connection."""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def publish_status_update(
    redis_client: redis.Redis,
    submission_id: str,
    status: str,
    **kwargs
) -> None:
    """Publish a status update via Redis pub/sub."""
    message = {
        "submissionId": submission_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **kwargs
    }
    redis_client.publish("submission:updates", json.dumps(message))
    logger.debug("Published status update", submission_id=submission_id, status=status)


def update_submission_db(
    db_conn,
    submission_id: str,
    status: str,
    execution_time: Optional[int] = None,
    memory_usage: Optional[int] = None,
    error_message: Optional[str] = None
) -> None:
    """Update submission record in the database."""
    with db_conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE submissions 
            SET status = %s,
                execution_time = %s,
                memory_usage = %s,
                error_message = %s,
                completed_at = CASE WHEN %s IN ('accepted', 'wrong_answer', 'time_limit_exceeded', 'runtime_error', 'compilation_error', 'system_error') THEN NOW() ELSE completed_at END,
                started_at = CASE WHEN %s = 'processing' THEN NOW() ELSE started_at END
            WHERE id = %s
            """,
            (
                status,
                execution_time,
                memory_usage,
                error_message,
                status,
                status,
                submission_id
            )
        )
        db_conn.commit()
    logger.debug("Updated submission in database", submission_id=submission_id, status=status)


def get_job_from_queue(redis_client: redis.Redis) -> Optional[Dict[str, Any]]:
    """
    Get a job from the BullMQ queue.
    BullMQ uses sorted sets for prioritized jobs.
    """
    # Get a job from the prioritized sorted set (lowest score first)
    # Use ZPOPMIN to atomically get and remove the job
    result = redis_client.zpopmin(QUEUE_PRIORITIZED_KEY, count=1)
    
    if not result:
        return None
    
    job_id = result[0][0]  # (job_id, score)
    
    # Add to active list
    redis_client.zadd(QUEUE_ACTIVE_KEY, {job_id: time.time() * 1000})
    
    # Get job data from hash
    job_key = f"bull:{QUEUE_NAME}:{job_id}"
    job_data = redis_client.hgetall(job_key)
    
    if not job_data:
        # Job might have been removed, clean up
        redis_client.zrem(QUEUE_ACTIVE_KEY, job_id)
        return None
    
    try:
        data = json.loads(job_data.get("data", "{}"))
        return {
            "id": job_id,
            "data": data,
            "job_key": job_key
        }
    except json.JSONDecodeError:
        logger.error("Failed to parse job data", job_id=job_id)
        redis_client.zrem(QUEUE_ACTIVE_KEY, job_id)
        return None


def complete_job(redis_client: redis.Redis, job_id: str, job_key: str) -> None:
    """Mark a job as completed and clean up."""
    redis_client.zrem(QUEUE_ACTIVE_KEY, job_id)
    # Optionally keep completed jobs for a while
    redis_client.expire(job_key, 3600)  # Keep for 1 hour


def fail_job(redis_client: redis.Redis, job_id: str, job_key: str, error: str) -> None:
    """Mark a job as failed."""
    redis_client.lrem(QUEUE_ACTIVE_KEY, 1, job_id)
    redis_client.hset(job_key, "failedReason", error)
    redis_client.expire(job_key, 86400)  # Keep failed jobs for 24 hours


def process_job(
    executor: CodeExecutor,
    redis_client: redis.Redis,
    db_conn,
    job: Dict[str, Any]
) -> None:
    """Process a single execution job."""
    job_data = job["data"]
    submission_id = job_data.get("submissionId")
    
    if not submission_id:
        logger.error("Job missing submissionId", job_id=job["id"])
        fail_job(redis_client, job["id"], job["job_key"], "Missing submissionId")
        return
    
    logger.info("Processing job", 
               job_id=job["id"],
               submission_id=submission_id,
               language=job_data.get("language"))
    
    try:
        # Publish running status
        publish_status_update(redis_client, submission_id, "Running")
        update_submission_db(db_conn, submission_id, "processing")
        
        # Prepare test cases
        test_cases = [
            TestCase(
                id=tc.get("id", i),
                input=tc.get("input", ""),
                expected_output=tc.get("expectedOutput", "")
            )
            for i, tc in enumerate(job_data.get("testCases", []))
        ]
        
        # Execute the code
        result = executor.execute_submission(
            submission_id=submission_id,
            language=job_data.get("language", "python"),
            code=job_data.get("code", ""),
            test_cases=test_cases
        )
        
        # Map the status to database format (lowercase)
        status_map = {
            "Accepted": "accepted",
            "Wrong Answer": "wrong_answer",
            "Time Limit Exceeded": "time_limit_exceeded",
            "Runtime Error": "runtime_error",
            "Compilation Error": "compilation_error",
        }
        db_status = status_map.get(result.status.value, "system_error")
        
        # Update database
        update_submission_db(
            db_conn,
            submission_id,
            db_status,
            result.total_execution_time_ms,
            result.max_memory_used_kb * 1024 if result.max_memory_used_kb else None,  # Convert KB to bytes
            result.stderr if result.status.value != "Accepted" else None
        )
        
        # Publish completion status (use frontend format)
        publish_status_update(
            redis_client,
            submission_id,
            result.status.value,
            executionTimeMs=result.total_execution_time_ms,
            memoryUsedKb=result.max_memory_used_kb,
            testResults=[
                {
                    "testCaseId": tr.test_case_id,
                    "passed": tr.passed,
                    "output": tr.output or "",
                    "executionTimeMs": tr.execution_time_ms,
                    "error": tr.error
                }
                for tr in result.test_results
            ],
            passedCount=result.passed_count,
            totalCount=result.total_count
        )
        
        # Mark job as completed
        complete_job(redis_client, job["id"], job["job_key"])
        
        logger.info("Job completed",
                   job_id=job["id"],
                   submission_id=submission_id,
                   status=result.status.value)
        
    except Exception as e:
        logger.error("Job processing failed",
                    job_id=job["id"],
                    submission_id=submission_id,
                    error=str(e),
                    exc_info=True)
        
        # Update database with error
        update_submission_db(
            db_conn,
            submission_id,
            "runtime_error",
            error_message=str(e)
        )
        
        # Publish error status
        publish_status_update(
            redis_client,
            submission_id,
            "Runtime Error",
            error=str(e)
        )
        
        # Mark job as failed
        fail_job(redis_client, job["id"], job["job_key"], str(e))


def run_worker() -> None:
    """Main worker loop."""
    global shutdown_requested
    
    logger.info("Starting worker",
               concurrency=WORKER_CONCURRENCY,
               timeout_ms=EXECUTION_TIMEOUT_MS,
               max_memory_mb=MAX_MEMORY_MB)
    
    # Setup signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Initialize executor
    config = ExecutionConfig(
        memory_limit=f"{MAX_MEMORY_MB}m",
        memory_swap=f"{MAX_MEMORY_MB}m",
        timeout_seconds=EXECUTION_TIMEOUT_MS // 1000
    )
    executor = CodeExecutor(config)
    
    # Check health
    if not executor.health_check():
        logger.error("Docker is not accessible, exiting")
        sys.exit(1)
    
    # Cleanup any orphaned containers from previous runs
    executor.cleanup()
    
    # Connect to services
    redis_client = get_redis_connection()
    db_conn = get_db_connection()
    
    logger.info("Worker ready, waiting for jobs")
    
    # Main loop
    poll_interval = 1  # seconds
    
    while not shutdown_requested:
        try:
            # Try to get a job from the queue
            job = get_job_from_queue(redis_client)
            
            if job:
                process_job(executor, redis_client, db_conn, job)
                poll_interval = 0.1  # Speed up polling when jobs are available
            else:
                poll_interval = min(poll_interval * 1.5, 5)  # Slow down when idle
                time.sleep(poll_interval)
                
        except redis.ConnectionError as e:
            logger.error("Redis connection error", error=str(e))
            time.sleep(5)
            redis_client = get_redis_connection()
            
        except psycopg2.Error as e:
            logger.error("Database error", error=str(e))
            time.sleep(5)
            db_conn = get_db_connection()
            
        except Exception as e:
            logger.error("Unexpected error in worker loop", error=str(e), exc_info=True)
            time.sleep(1)
    
    # Cleanup on shutdown
    logger.info("Shutting down worker")
    executor.cleanup()
    redis_client.close()
    db_conn.close()
    logger.info("Worker shutdown complete")


if __name__ == "__main__":
    run_worker()
