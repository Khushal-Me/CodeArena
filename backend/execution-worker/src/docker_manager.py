"""Docker container management for code execution."""

import os
import time
import uuid
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import docker
from docker.models.containers import Container
from docker.errors import ContainerError, ImageNotFound, APIError

from .logger import get_logger

logger = get_logger("docker_manager")


class Language(str, Enum):
    """Supported programming languages."""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"


@dataclass
class ExecutionConfig:
    """Configuration for container execution."""
    memory_limit: str = "256m"
    memory_swap: str = "256m"
    cpu_period: int = 100000
    cpu_quota: int = 50000  # 50% of one CPU
    pids_limit: int = 50
    network_mode: str = "none"
    read_only: bool = True
    timeout_seconds: int = 10
    tmpfs_size: str = "100m"


# Language-specific image and command configurations
LANGUAGE_CONFIG: Dict[Language, Dict[str, Any]] = {
    Language.PYTHON: {
        "image": "codearena/python-runner:latest",
        "fallback_image": "python:3.11-alpine",
        "file_ext": ".py",
        "compile_cmd": None,
        "run_cmd": ["python", "/code/solution.py"],
    },
    Language.JAVASCRIPT: {
        "image": "codearena/javascript-runner:latest",
        "fallback_image": "node:20-alpine",
        "file_ext": ".js",
        "compile_cmd": None,
        "run_cmd": ["node", "/code/solution.js"],
    },
    Language.JAVA: {
        "image": "codearena/java-runner:latest",
        "fallback_image": "openjdk:17-alpine",
        "file_ext": ".java",
        "compile_cmd": ["javac", "/code/Solution.java"],
        "run_cmd": ["java", "-cp", "/code", "Solution"],
    },
    Language.CPP: {
        "image": "codearena/cpp-runner:latest",
        "fallback_image": "gcc:11",
        "file_ext": ".cpp",
        "compile_cmd": ["g++", "-o", "/code/solution", "/code/solution.cpp", "-O2"],
        "run_cmd": ["/code/solution"],
    },
}


@dataclass
class ExecutionResult:
    """Result of code execution."""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: int
    memory_used_kb: int
    timed_out: bool = False
    error: Optional[str] = None


class DockerManager:
    """Manages Docker containers for code execution."""

    def __init__(self, config: Optional[ExecutionConfig] = None):
        self.config = config or ExecutionConfig()
        self.client = docker.from_env()
        self.container_prefix = os.getenv("CONTAINER_PREFIX", "codearena-exec")
        logger.info("DockerManager initialized", prefix=self.container_prefix)

    def _get_image(self, language: Language) -> str:
        """Get the Docker image for a language, pulling if necessary."""
        lang_config = LANGUAGE_CONFIG[language]
        image_name = lang_config["image"]
        
        try:
            self.client.images.get(image_name)
            return image_name
        except ImageNotFound:
            logger.info("Custom image not found, using fallback", 
                       image=image_name, fallback=lang_config["fallback_image"])
            fallback = lang_config["fallback_image"]
            try:
                self.client.images.get(fallback)
            except ImageNotFound:
                logger.info("Pulling fallback image", image=fallback)
                self.client.images.pull(fallback)
            return fallback

    def _create_container(
        self, 
        language: Language, 
        code: str, 
        stdin_data: str
    ) -> Tuple[Container, str]:
        """Create a Docker container for code execution."""
        
        container_id = f"{self.container_prefix}-{uuid.uuid4().hex[:8]}"
        image = self._get_image(language)
        lang_config = LANGUAGE_CONFIG[language]
        
        # Prepare the code file
        if language == Language.JAVA:
            filename = "Solution" + lang_config["file_ext"]
        else:
            filename = "solution" + lang_config["file_ext"]

        # Create container with security settings
        container = self.client.containers.create(
            image=image,
            name=container_id,
            command=["sh", "-c", "sleep infinity"],  # Keep alive for commands
            mem_limit=self.config.memory_limit,
            memswap_limit=self.config.memory_swap,
            cpu_period=self.config.cpu_period,
            cpu_quota=self.config.cpu_quota,
            pids_limit=self.config.pids_limit,
            network_mode=self.config.network_mode,
            read_only=self.config.read_only,
            user="1000:1000",
            security_opt=["no-new-privileges:true"],
            tmpfs={"/code": f"size={self.config.tmpfs_size},mode=1777"},
            detach=True,
            stdin_open=True,
            environment={
                "HOME": "/tmp",
            },
        )

        logger.debug("Container created", container_id=container_id, language=language.value)
        
        return container, filename

    def _run_command(
        self, 
        container: Container, 
        cmd: list, 
        stdin_data: Optional[str] = None,
        timeout: int = 10
    ) -> Tuple[int, str, str, int]:
        """Run a command in the container and return results."""
        
        start_time = time.time()
        
        try:
            # Execute command
            exec_result = container.exec_run(
                cmd,
                stdin=True if stdin_data else False,
                demux=True,
                environment={"HOME": "/tmp"},
            )
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            stdout = exec_result.output[0].decode("utf-8") if exec_result.output[0] else ""
            stderr = exec_result.output[1].decode("utf-8") if exec_result.output[1] else ""
            
            return exec_result.exit_code, stdout, stderr, execution_time_ms
            
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            logger.error("Command execution failed", error=str(e))
            return 1, "", str(e), execution_time_ms

    def execute(
        self, 
        language: Language, 
        code: str, 
        stdin_data: str = ""
    ) -> ExecutionResult:
        """Execute code in a secure container."""
        
        container = None
        start_time = time.time()
        
        try:
            lang_config = LANGUAGE_CONFIG[language]
            
            # Create container
            container, filename = self._create_container(language, code, stdin_data)
            container.start()
            
            # Write code to container
            if language == Language.JAVA:
                file_path = f"/code/{filename}"
            else:
                file_path = f"/code/{filename}"
            
            # Use exec to write file (since tmpfs is writable)
            write_cmd = f"cat > {file_path}"
            exec_id = self.client.api.exec_create(
                container.id, 
                ["sh", "-c", write_cmd],
                stdin=True
            )
            sock = self.client.api.exec_start(exec_id, socket=True)
            sock._sock.sendall(code.encode("utf-8"))
            sock._sock.close()
            
            # Wait for file write
            time.sleep(0.1)
            
            # Compile if needed
            if lang_config["compile_cmd"]:
                exit_code, stdout, stderr, compile_time = self._run_command(
                    container, 
                    lang_config["compile_cmd"],
                    timeout=self.config.timeout_seconds
                )
                
                if exit_code != 0:
                    return ExecutionResult(
                        success=False,
                        stdout=stdout,
                        stderr=stderr,
                        exit_code=exit_code,
                        execution_time_ms=compile_time,
                        memory_used_kb=0,
                        error="Compilation Error"
                    )
            
            # Run the code
            run_cmd = lang_config["run_cmd"]
            
            # For stdin, we need to pipe it through
            if stdin_data:
                run_cmd = ["sh", "-c", f"echo '{stdin_data}' | {' '.join(run_cmd)}"]
            
            exit_code, stdout, stderr, execution_time_ms = self._run_command(
                container,
                run_cmd,
                stdin_data=stdin_data,
                timeout=self.config.timeout_seconds
            )
            
            # Check for timeout
            timed_out = (time.time() - start_time) > self.config.timeout_seconds
            
            # Get memory usage (approximate)
            try:
                stats = container.stats(stream=False)
                memory_used_kb = stats.get("memory_stats", {}).get("usage", 0) // 1024
            except Exception:
                memory_used_kb = 0
            
            return ExecutionResult(
                success=exit_code == 0 and not timed_out,
                stdout=stdout.strip(),
                stderr=stderr.strip(),
                exit_code=exit_code,
                execution_time_ms=execution_time_ms,
                memory_used_kb=memory_used_kb,
                timed_out=timed_out,
                error="Time Limit Exceeded" if timed_out else None
            )
            
        except ContainerError as e:
            logger.error("Container execution error", error=str(e))
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=str(e),
                exit_code=1,
                execution_time_ms=int((time.time() - start_time) * 1000),
                memory_used_kb=0,
                error="Runtime Error"
            )
        except Exception as e:
            logger.error("Unexpected execution error", error=str(e), exc_info=True)
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=str(e),
                exit_code=1,
                execution_time_ms=int((time.time() - start_time) * 1000),
                memory_used_kb=0,
                error="Internal Error"
            )
        finally:
            # Cleanup container
            if container:
                try:
                    container.stop(timeout=1)
                    container.remove(force=True)
                    logger.debug("Container cleaned up", container_id=container.name)
                except Exception as e:
                    logger.error("Failed to cleanup container", error=str(e))

    def cleanup_orphaned_containers(self) -> int:
        """Remove any orphaned execution containers."""
        removed = 0
        try:
            containers = self.client.containers.list(
                all=True,
                filters={"name": self.container_prefix}
            )
            for container in containers:
                try:
                    container.remove(force=True)
                    removed += 1
                    logger.info("Removed orphaned container", container_id=container.name)
                except Exception as e:
                    logger.error("Failed to remove container", 
                               container_id=container.name, error=str(e))
        except Exception as e:
            logger.error("Failed to list containers", error=str(e))
        
        return removed

    def health_check(self) -> bool:
        """Check if Docker is accessible."""
        try:
            self.client.ping()
            return True
        except Exception:
            return False
